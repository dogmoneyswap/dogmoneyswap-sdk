import { BigNumber } from '@ethersproject/bignumber'
import { Pool, RToken, RouteLeg, MultiRoute, RouteStatus } from '../types/MultiRouterTypes'
import { ASSERT, calcInByOut, calcOutByIn, closeValues, calcPrice } from '../utils/MultiRouterMath'
import TopologicalSort from '../utils/TopologicalSort'

class Edge {
  readonly GasConsumption = 40_000
  readonly MINIMUM_LIQUIDITY = 1000
  pool: Pool
  vert0: Vertice
  vert1: Vertice

  direction: boolean
  amountInPrevious: number // How many liquidity were passed from vert0 to vert1
  amountOutPrevious: number // How many liquidity were passed from vert0 to vert1
  bestEdgeIncome: number // debug data

  constructor(p: Pool, v0: Vertice, v1: Vertice) {
    this.pool = p
    this.vert0 = v0
    this.vert1 = v1
    this.amountInPrevious = 0
    this.amountOutPrevious = 0
    this.direction = true
    this.bestEdgeIncome = 0
  }

  reserve(v: Vertice): BigNumber {
    return v === this.vert0 ? this.pool.reserve0 : this.pool.reserve1
  }

  calcOutput(v: Vertice, amountIn: number) {
    const pool = this.pool
    let out,
      gas = this.amountInPrevious ? 0 : this.GasConsumption
    if (v === this.vert1) {
      if (this.direction) {
        if (amountIn < this.amountOutPrevious) {
          out = this.amountInPrevious - calcInByOut(pool, this.amountOutPrevious - amountIn, true)
        } else {
          out = calcOutByIn(pool, amountIn - this.amountOutPrevious, false) + this.amountInPrevious
        }
        if (amountIn === this.amountOutPrevious) {
          // TODO: accuracy?
          gas = -this.GasConsumption
        }
      } else {
        out = calcOutByIn(pool, this.amountOutPrevious + amountIn, false) - this.amountInPrevious
      }
    } else {
      if (this.direction) {
        out = calcOutByIn(pool, this.amountInPrevious + amountIn, true) - this.amountOutPrevious
      } else {
        if (amountIn === this.amountInPrevious) {
          // TODO: accuracy?
          gas = -this.GasConsumption
        }
        if (amountIn < this.amountInPrevious) {
          out = this.amountOutPrevious - calcInByOut(pool, this.amountInPrevious - amountIn, false)
        } else {
          out = calcOutByIn(pool, amountIn - this.amountInPrevious, true) + this.amountOutPrevious
        }
      }
    }

    // this.testApply(v, amountIn, out);

    return [out, gas]
  }

  checkMinimalLiquidityExceededAfterSwap(from: Vertice, amountOut: number): boolean {
    if (from === this.vert0) {
      const r1 = parseInt(this.pool.reserve1.toString())
      if (this.direction) {
        return r1 - amountOut - this.amountOutPrevious < this.MINIMUM_LIQUIDITY
      } else {
        return r1 - amountOut + this.amountOutPrevious < this.MINIMUM_LIQUIDITY
      }
    } else {
      const r0 = parseInt(this.pool.reserve0.toString())
      if (this.direction) {
        return r0 - amountOut + this.amountInPrevious < this.MINIMUM_LIQUIDITY
      } else {
        return r0 - amountOut - this.amountInPrevious < this.MINIMUM_LIQUIDITY
      }
    }
  }

  // doesn't used in production - just for testing
  testApply(from: Vertice, amountIn: number, amountOut: number) {
    console.assert(this.amountInPrevious * this.amountOutPrevious >= 0)
    const inPrev = this.direction ? this.amountInPrevious : -this.amountInPrevious
    const outPrev = this.direction ? this.amountOutPrevious : -this.amountOutPrevious
    const to = from.getNeibour(this)
    let directionNew,
      amountInNew = 0,
      amountOutNew = 0
    if (to) {
      const inInc = from === this.vert0 ? amountIn : -amountOut
      const outInc = from === this.vert0 ? amountOut : -amountIn
      const inNew = inPrev + inInc
      const outNew = outPrev + outInc
      if (inNew * outNew < 0) console.log('333')
      console.assert(inNew * outNew >= 0)
      if (inNew >= 0) {
        directionNew = true
        amountInNew = inNew
        amountOutNew = outNew
      } else {
        directionNew = false
        amountInNew = -inNew
        amountOutNew = -outNew
      }
    } else console.error('Error 221')

    if (directionNew) {
      const calc = calcOutByIn(this.pool, amountInNew, directionNew)
      const res = closeValues(amountOutNew, calc, 1e-6)
      if (!res) console.log('Err 225-1 !!', amountOutNew, calc, Math.abs(calc / amountOutNew - 1))
      return res
    } else {
      const calc = calcOutByIn(this.pool, amountOutNew, directionNew)
      const res = closeValues(amountInNew, calc, 1e-6)
      if (!res) console.log('Err 225-2!!', amountInNew, calc, Math.abs(calc / amountInNew - 1))
      return res
    }
  }

  applySwap(from: Vertice) {
    console.assert(this.amountInPrevious * this.amountOutPrevious >= 0)
    const inPrev = this.direction ? this.amountInPrevious : -this.amountInPrevious
    const outPrev = this.direction ? this.amountOutPrevious : -this.amountOutPrevious
    const to = from.getNeibour(this)
    if (to) {
      const inInc = from === this.vert0 ? from.bestIncome : -to.bestIncome
      const outInc = from === this.vert0 ? to.bestIncome : -from.bestIncome
      const inNew = inPrev + inInc
      const outNew = outPrev + outInc
      console.assert(inNew * outNew >= 0)
      if (inNew >= 0) {
        this.direction = true
        this.amountInPrevious = inNew
        this.amountOutPrevious = outNew
      } else {
        this.direction = false
        this.amountInPrevious = -inNew
        this.amountOutPrevious = -outNew
      }
    } else console.error('Error 221')

    ASSERT(() => {
      if (this.direction)
        return closeValues(this.amountOutPrevious, calcOutByIn(this.pool, this.amountInPrevious, this.direction), 1e-6)
      else {
        return closeValues(this.amountInPrevious, calcOutByIn(this.pool, this.amountOutPrevious, this.direction), 1e-6)
      }
    }, `Error 225`)
  }
}

class Vertice {
  token: RToken
  edges: Edge[]

  price: number
  gasPrice: number

  bestIncome: number // temp data used for findBestPath algorithm
  gasSpent: number // temp data used for findBestPath algorithm
  bestTotal: number // temp data used for findBestPath algorithm
  bestSource?: Edge // temp data used for findBestPath algorithm
  checkLine: number // debug data

  constructor(t: RToken) {
    this.token = t
    this.edges = []
    this.price = 0
    this.gasPrice = 0
    this.bestIncome = 0
    this.gasSpent = 0
    this.bestTotal = 0
    this.bestSource = undefined
    this.checkLine = -1
  }

  getNeibour(e?: Edge) {
    if (!e) return
    return e.vert0 === this ? e.vert1 : e.vert0
  }
}

export class Graph {
  vertices: Vertice[]
  edges: Edge[]
  tokens: Map<RToken, Vertice>

  constructor(pools: Pool[], baseToken: RToken, gasPrice: number) {
    this.vertices = []
    this.edges = []
    this.tokens = new Map()
    pools.forEach(p => {
      const v0 = this.getOrCreateVertice(p.token0)
      const v1 = this.getOrCreateVertice(p.token1)
      const edge = new Edge(p, v0, v1)
      v0.edges.push(edge)
      v1.edges.push(edge)
      this.edges.push(edge)
    })
    const baseVert = this.tokens.get(baseToken)
    if (baseVert) {
      this.setPrices(baseVert, 1, gasPrice)
    }
  }

  setPrices(from: Vertice, price: number, gasPrice: number) {
    if (from.price !== 0) return
    from.price = price
    from.gasPrice = gasPrice
    const edges = from.edges
      .map((e): [Edge, number] => [e, parseInt(e.reserve(from).toString())])
      .sort(([_1, r1], [_2, r2]) => r2 - r1)
    edges.forEach(([e, _]) => {
      const v = e.vert0 === from ? e.vert1 : e.vert0
      if (v.price !== 0) return
      let p = calcPrice(e.pool, 0, false)
      if (from === e.vert0) p = 1 / p
      this.setPrices(v, price * p, gasPrice / p)
    })
  }

  getOrCreateVertice(token: RToken) {
    let vert = this.tokens.get(token)
    if (vert) return vert
    vert = new Vertice(token)
    this.vertices.push(vert)
    this.tokens.set(token, vert)
    return vert
  }

  // @ts-ignore
  exportPath(from: RToken, to: RToken) {
    /*
    //}, _route: MultiRoute) {
    // const allPools = new Map<string, Pool>();
    // this.edges.forEach(p => allPools.set(p.address, p));
    // const usedPools = new Map<string, boolean>();
    // route.legs.forEach(l => usedPools.set(l.address, l.token === allPools.get(l.address)?.token0))

    const fromVert = this.tokens.get(from) as Vertice
    const toVert = this.tokens.get(to) as Vertice
    const initValue = (fromVert.bestIncome * fromVert.price) / toVert.price

    const route = new Set<Edge>()
    for (let v = toVert; v !== fromVert; v = v.getNeibour(v.bestSource) as Vertice) {
      if (v.bestSource) route.add(v.bestSource)
    }

    function edgeStyle(e: Edge) {
      const finish = e.vert1.bestSource === e
      const start = e.vert0.bestSource === e
      let label
      if (e.bestEdgeIncome == -1) label = 'label: "low_liq"'
      if (e.bestEdgeIncome !== 0) label = `label: "${print((e.bestEdgeIncome / initValue - 1) * 100, 3)}%"`
      const edgeValue = route.has(e) ? 'value: 2' : undefined
      let arrow
      if (finish && start) arrow = 'arrows: "from,to"'
      if (finish) arrow = 'arrows: "to"'
      if (start) arrow = 'arrows: "from"'
      return ['', label, edgeValue, arrow].filter(a => a !== undefined).join(', ')
    }

    function print(n: number, digits: number) {
      let out
      if (n === 0) out = '0'
      else {
        const n0 = n > 0 ? n : -n
        const shift = digits - Math.ceil(Math.log(n0) / Math.LN10)
        if (shift <= 0) out = `${Math.round(n0)}`
        else {
          const mult = Math.pow(10, shift)
          out = `${Math.round(n0 * mult) / mult}`
        }
        if (n < 0) out = -out
      }
      return out
    }

    function nodeLabel(v: Vertice) {
      const value = (v.bestIncome * v.price) / toVert.price
      const income = `${print(value, 3)}`
      const total = `${print(v.bestTotal, 3)}`
      // const income = `${print((value/initValue-1)*100, 3)}%`
      // const total = `${print((v.bestTotal/initValue-1)*100, 3)}%`
      const checkLine = v.checkLine == -1 ? undefined : `${v.checkLine}`
      return [checkLine, income, total].filter(a => a !== undefined).join(':')
    }

    const nodes = `var nodes = new vis.DataSet([
      ${this.vertices.map(t => `{ id: ${t.token.name}, label: "${nodeLabel(t)}"}`).join(',\n\t\t')}
    ]);\n`
    const edges = `var edges = new vis.DataSet([
      ${this.edges.map(p => `{ from: ${p.vert0.token.name}, to: ${p.vert1.token.name}${edgeStyle(p)}}`).join(',\n\t\t')}
    ]);\n`
    const data = `var data = {
        nodes: nodes,
        edges: edges,
    };\n`

    const fs = require('fs')
    fs.writeFileSync('D:/Info/Notes/GraphVisualization/data.js', nodes + edges + data)
    */
  }

  findBestPath(
    from: RToken,
    to: RToken,
    amountIn: number
  ):
    | {
        path: Edge[]
        output: number
        gasSpent: number
        totalOutput: number
      }
    | undefined {
    const start = this.tokens.get(from)
    const finish = this.tokens.get(to)
    if (!start || !finish) return

    this.edges.forEach(e => (e.bestEdgeIncome = 0))
    this.vertices.forEach(v => {
      v.bestIncome = 0
      v.gasSpent = 0
      v.bestTotal = 0
      v.bestSource = undefined
      v.checkLine = -1
    })
    start.bestIncome = amountIn
    start.bestTotal = amountIn
    const processedVert = new Set<Vertice>()
    const nextVertList = [start] // TODO: Use sorted Set!

    let checkLine = 0
    for (;;) {
      let closestVert: Vertice | undefined
      let closestTotal = -1
      let closestPosition = 0
      nextVertList.forEach((v, i) => {
        if (v.bestTotal > closestTotal) {
          closestTotal = v.bestTotal
          closestVert = v
          closestPosition = i
        }
      })

      if (!closestVert) return

      closestVert.checkLine = checkLine++

      if (closestVert === finish) {
        const bestPath = []
        for (let v: Vertice | undefined = finish; v?.bestSource; v = v.getNeibour(v.bestSource)) {
          bestPath.unshift(v.bestSource)
        }
        return {
          path: bestPath,
          output: finish.bestIncome,
          gasSpent: finish.gasSpent,
          totalOutput: finish.bestTotal
        }
      }
      nextVertList.splice(closestPosition, 1)

      closestVert.edges.forEach(e => {
        const v2 = closestVert === e.vert0 ? e.vert1 : e.vert0
        if (processedVert.has(v2)) return
        let newIncome, gas
        try {
          ;[newIncome, gas] = e.calcOutput(closestVert as Vertice, (closestVert as Vertice).bestIncome)
        } catch (e) {
          // Any arithmetic error or out-of-liquidity
          return
        }
        if (e.checkMinimalLiquidityExceededAfterSwap(closestVert as Vertice, newIncome)) {
          e.bestEdgeIncome = -1
          return
        }
        const newGasSpent = (closestVert as Vertice).gasSpent + gas
        const price = v2.price / finish.price
        const newTotal = newIncome * price - newGasSpent * finish.gasPrice

        console.assert(e.bestEdgeIncome === 0, 'Error 373')
        e.bestEdgeIncome = newIncome * price

        if (!v2.bestSource) nextVertList.push(v2)
        if (!v2.bestSource || newTotal > v2.bestTotal) {
          v2.bestIncome = newIncome
          v2.gasSpent = newGasSpent
          v2.bestTotal = newTotal
          v2.bestSource = e
        }
      })
      processedVert.add(closestVert)
    }
  }

  addPath(from: Vertice | undefined, to: Vertice | undefined, path: Edge[]) {
    let _from = from
    path.forEach(e => {
      if (_from) {
        e.applySwap(_from)
        _from = _from.getNeibour(e)
      } else {
        console.error('Unexpected 315')
      }
    })

    ASSERT(() => {
      const res = this.vertices.every(v => {
        let total = 0
        let totalModule = 0
        v.edges.forEach(e => {
          if (e.vert0 === v) {
            if (e.direction) {
              total -= e.amountInPrevious
            } else {
              total += e.amountInPrevious
            }
            totalModule += e.amountInPrevious
          } else {
            if (e.direction) {
              total += e.amountOutPrevious
            } else {
              total -= e.amountOutPrevious
            }
            totalModule += e.amountOutPrevious
          }
        })
        if (v === from) return total <= 0
        if (v === to) return total >= 0
        if (totalModule === 0) return total === 0
        return Math.abs(total / totalModule) < 1e10
      })
      return res
    }, 'Error 290')
  }

  findBestRoute(from: RToken, to: RToken, amountIn: number, mode: number | number[]): MultiRoute {
    let routeValues = []
    if (Array.isArray(mode)) {
      const sum = mode.reduce((a, b) => a + b, 0)
      routeValues = mode.map(e => e / sum)
    } else {
      for (let i = 0; i < mode; ++i) routeValues.push(1 / mode)
    }

    this.edges.forEach(e => {
      e.amountInPrevious = 0
      e.amountOutPrevious = 0
      e.direction = true
    })
    let output = 0
    let gasSpent = 0
    let totalOutput = 0
    let totalrouted = 0
    let step
    for (step = 0; step < routeValues.length; ++step) {
      const p = this.findBestPath(from, to, amountIn * routeValues[step])
      if (!p) {
        break
      } else {
        output += p.output
        gasSpent += p.gasSpent
        totalOutput += p.totalOutput
        this.addPath(this.tokens.get(from), this.tokens.get(to), p.path)
        totalrouted += routeValues[step]
      }
    }
    let status
    if (step === 0) status = RouteStatus.NoWay
    else if (step < routeValues.length) status = RouteStatus.Partial
    else status = RouteStatus.Success

    return {
      status,
      amountIn: amountIn * totalrouted,
      amountOut: output,
      legs: this.getRouteLegs(),
      gasSpent: gasSpent,
      totalAmountOut: totalOutput
    }
  }

  getRouteLegs(): RouteLeg[] {
    const nodes = this.topologySort()
    const legs: RouteLeg[] = []
    nodes.forEach(n => {
      const outEdges = n.edges
        .map(e => {
          const from = this.edgeFrom(e)
          return from ? [e, from[0], from[1]] : [e]
        })
        .filter(e => e[1] === n)

      let outAmount = outEdges.reduce((a, b) => a + (b[2] as number), 0)
      if (outAmount <= 0) return

      const total = outAmount
      outEdges.forEach((e, i) => {
        const p = e[2] as number
        const quantity = i + 1 === outEdges.length ? 1 : p / outAmount
        legs.push({
          address: (e[0] as Edge).pool.address,
          token: n.token,
          swapPortion: quantity,
          absolutePortion: p / total
        })
        outAmount -= p
      })
      console.assert(outAmount / total < 1e-12, 'Error 281')
    })
    return legs
  }

  edgeFrom(e: Edge): [Vertice, number] | undefined {
    if (e.amountInPrevious === 0) return undefined
    return e.direction ? [e.vert0, e.amountInPrevious] : [e.vert1, e.amountOutPrevious]
  }

  getOutputEdges(v: Vertice): Edge[] {
    return v.edges.filter(e => {
      const from = this.edgeFrom(e)
      if (from === undefined) return false
      return from[0] === v
    })
  }

  topologySort(): Vertice[] {
    const nodes = new Map<string, Vertice>()
    this.vertices.forEach(v => nodes.set(v.token.name, v))
    const sortOp = new TopologicalSort(nodes)
    this.edges.forEach(e => {
      if (e.amountInPrevious === 0) return
      if (e.direction) sortOp.addEdge(e.vert0.token.name, e.vert1.token.name)
      else sortOp.addEdge(e.vert1.token.name, e.vert0.token.name)
    })
    const sorted = Array.from(sortOp.sort().keys()).map(k => nodes.get(k)) as Vertice[]

    return sorted
  }
}

export function findMultiRouting(
  from: RToken,
  to: RToken,
  amountIn: number,
  pools: Pool[],
  baseToken: RToken,
  gasPrice: number,
  steps: number | number[] = 12
): MultiRoute {
  const g = new Graph(pools, baseToken, gasPrice)
  const fromV = g.tokens.get(from)
  if (fromV?.price === 0) {
    g.setPrices(fromV, 1, 0)
  }
  const out = g.findBestRoute(from, to, amountIn, steps)
  return out
}

// @ts-ignore
import seedrandom from 'seedrandom'
import { findMultiRouting, Graph } from '../src/entities/MultiRouter'
import { RConstantProductPool, Pool, RToken, MultiRoute, RouteStatus, RouteLeg } from '../src/types/MultiRouterTypes'
import { getBigNumber } from '../src/utils/MultiRouterMath'

const testSeed = '2' // Change it to change random generator values
const rnd: () => number = seedrandom(testSeed) // random [0, 1)

const GAS_PRICE = 1 * 200 * 1e-9
//const TOKEN_NUMBER = 20
const MIN_TOKEN_PRICE = 1e-6
const MAX_TOKEN_PRICE = 1e6
const POOL_CP_DENSITY = 0.3
const MIN_POOL_RESERVE = 1e9
const MAX_POOL_RESERVE = 1e31
const MIN_POOL_IMBALANCE = 1 / (1 + 1e-3)
const MAX_POOL_IMBALANCE = 1 + 1e-3
const MIN_LIQUIDITY = 1000
const MAX_LIQUIDITY = Math.pow(2, 110)

interface Variants {
  [key: string]: number
}

function choice(rnd: () => number, obj: Variants) {
  let total = 0
  Object.entries(obj).forEach(([_, p]) => (total += p))
  if (total <= 0) throw new Error('Error 62')
  const val = rnd() * total
  let past = 0
  for (let k in obj) {
    past += obj[k]
    if (past >= val) return k
  }
  throw new Error('Error 70')
}

function getRandom(rnd: () => number, min: number, max: number) {
  const minL = Math.log(min)
  const maxL = Math.log(max)
  const v = rnd() * (maxL - minL) + minL
  const res = Math.exp(v)
  console.assert(res <= max && res >= min, 'Random value is out of the range')
  return res
}

function getTokenPrice(rnd: () => number) {
  /*const cmd = choice(rnd, {
        min: 0.1,
        middle: 0.8,
        max: 0.1,
    })
    switch (cmd) {
        case 'min': return getRandom(rnd, MIN_TOKEN_PRICE, Math.min(MIN_TOKEN_PRICE*100, MAX_TOKEN_PRICE));
        case 'middle': return getRandom(rnd, MIN_TOKEN_PRICE, MAX_TOKEN_PRICE);
        case 'max': return getRandom(rnd, Math.max(MAX_TOKEN_PRICE/100, MIN_TOKEN_PRICE), MAX_TOKEN_PRICE);
    }*/
  const price = getRandom(rnd, MIN_TOKEN_PRICE, MAX_TOKEN_PRICE)
  return price
}

function getPoolReserve(rnd: () => number) {
  /*const cmd = choice(rnd, {
        min: 0.1,
        middle: 0.8,
        max: 0.1,
    })
    switch (cmd) {
        case 'min': return getRandom(rnd, MIN_POOL_RESERVE, Math.min(MIN_POOL_RESERVE*100, MAX_POOL_RESERVE));
        case 'middle': return getRandom(
            rnd, 
            Math.max(MIDDLE_POOL_RESERVE/100, MIN_POOL_RESERVE), 
            Math.min(MIDDLE_POOL_RESERVE*100, MAX_POOL_RESERVE)
        );
        case 'max': return getRandom(rnd, Math.max(MAX_POOL_RESERVE/100, MIN_POOL_RESERVE), MAX_POOL_RESERVE);
    }*/
  return getRandom(rnd, MIN_POOL_RESERVE, MAX_POOL_RESERVE)
}

function getPoolFee(rnd: () => number) {
  const fees = [0.003, 0.001, 0.0005]
  const cmd = choice(rnd, {
    0: 1,
    1: 1,
    2: 1
  })
  return fees[parseInt(cmd)]
}

function getPoolImbalance(rnd: () => number) {
  return getRandom(rnd, MIN_POOL_IMBALANCE, MAX_POOL_IMBALANCE)
}

function getCPPool(rnd: () => number, t0: RToken, t1: RToken, price: number) {
  if (rnd() < 0.5) {
    const t = t0
    t0 = t1
    t1 = t
    price = 1 / price
  }

  const fee = getPoolFee(rnd)
  const imbalance = getPoolImbalance(rnd)

  let reserve0 = getPoolReserve(rnd)
  let reserve1 = reserve0 * price * imbalance
  const maxReserve = Math.max(reserve0, reserve1)
  if (maxReserve > MAX_LIQUIDITY) {
    const reduceRate = (maxReserve / MAX_LIQUIDITY) * 1.00000001
    reserve0 /= reduceRate
    reserve1 /= reduceRate
  }
  const minReserve = Math.min(reserve0, reserve1)
  if (minReserve < MIN_LIQUIDITY) {
    const raseRate = (MIN_LIQUIDITY / minReserve) * 1.00000001
    reserve0 *= raseRate
    reserve1 *= raseRate
  }
  console.assert(reserve0 >= MIN_LIQUIDITY && reserve0 <= MAX_LIQUIDITY, 'Error reserve0 clculation')
  console.assert(reserve1 >= MIN_LIQUIDITY && reserve1 <= MAX_LIQUIDITY, 'Error reserve1 clculation ' + reserve1)

  return new RConstantProductPool({
    token0: t0,
    token1: t1,
    address: `pool cp ${t0.name} ${t1.name} ${reserve0} ${price} ${fee}`,
    reserve0: getBigNumber(undefined, reserve0),
    reserve1: getBigNumber(undefined, reserve1),
    fee
  })
}

interface Network {
  tokens: RToken[]
  prices: number[]
  pools: Pool[]
  gasPrice: number
}

function createNetwork(rnd: () => number, tokenNumber: number): Network {
  const tokens = []
  const prices = []
  for (var i = 0; i < tokenNumber; ++i) {
    tokens.push({ name: '' + i, address: '' + i })
    prices.push(getTokenPrice(rnd))
  }

  const pools = []
  for (i = 0; i < tokenNumber; ++i) {
    for (var j = i + 1; j < tokenNumber; ++j) {
      const r = rnd()
      if (r < POOL_CP_DENSITY) {
        pools.push(getCPPool(rnd, tokens[i], tokens[j], prices[i] / prices[j]))
      }
      if (r < POOL_CP_DENSITY * POOL_CP_DENSITY) {
        // second pool
        pools.push(getCPPool(rnd, tokens[i], tokens[j], prices[i] / prices[j]))
      }
      if (r < POOL_CP_DENSITY * POOL_CP_DENSITY * POOL_CP_DENSITY) {
        // third pool
        pools.push(getCPPool(rnd, tokens[i], tokens[j], prices[i] / prices[j]))
      }
    }
  }

  return {
    tokens,
    prices,
    pools,
    gasPrice: GAS_PRICE
  }
}

function expectToBeClose(a: number, b: number, max: number) {
  expect(Math.abs(a / b - 1)).toBeLessThan(max)
}

function getTokenPools(network: Network): Map<RToken, Pool[]> {
  const tokenPools = new Map<RToken, Pool[]>()
  network.pools.forEach(p => {
    const pools0 = tokenPools.get(p.token0)
    if (pools0) {
      pools0.push(p)
    } else {
      tokenPools.set(p.token0, [p])
    }
    const pools1 = tokenPools.get(p.token1)
    if (pools1) {
      pools1.push(p)
    } else {
      tokenPools.set(p.token1, [p])
    }
  })
  return tokenPools
}

function getAllConnectedTokens(start: RToken, tokenPools: Map<RToken, Pool[]>): Set<RToken> {
  const connected = new Set<RToken>()
  const nextTokens = [start]
  while (nextTokens.length) {
    const token = nextTokens.pop() as RToken
    if (connected.has(token)) {
      continue
    }
    connected.add(token)
    tokenPools.get(token)?.forEach(p => {
      const token2 = token == p.token0 ? p.token1 : p.token0
      nextTokens.push(token2)
    })
  }
  return connected
}

function checkRoute(
  network: Network,
  from: RToken,
  to: RToken,
  amountIn: number,
  baseToken: RToken,
  gasPrice: number,
  route: MultiRoute
) {
  const tokenPools = getTokenPools(network)
  const connectedTokens = getAllConnectedTokens(from, tokenPools)
  if (!connectedTokens.has(to)) {
    expect(route.status).toEqual(RouteStatus.NoWay)
    return
  }
  const basePricesAreSet = connectedTokens.has(baseToken)

  // amountIn checks
  if (route.status === RouteStatus.Success) expect(route.amountIn).toEqual(amountIn)
  else if (route.status === RouteStatus.Partial) {
    expect(route.amountIn).toBeLessThan(amountIn)
    expect(route.amountIn).toBeGreaterThan(0)
  }

  // amountOut checks
  if (route.status !== RouteStatus.NoWay) expect(route.amountOut).toBeGreaterThan(0)
  const outPriceToIn = network.prices[parseInt(to.name)] / network.prices[parseInt(from.name)]
  // Slippage is always not-negative
  expect(route.amountOut).toBeLessThanOrEqual((route.amountIn / outPriceToIn) * 1.001)

  // gasSpent checks
  const poolMap = new Map<string, Pool>()
  network.pools.forEach(p => poolMap.set(p.address, p))
  const expectedGasSpent = route.legs.reduce((a, b) => a + (poolMap.get(b.address)?.swapGasCost as number), 0)
  expect(route.gasSpent).toEqual(expectedGasSpent)

  // totalAmountOut checks
  if (route.status === RouteStatus.NoWay) {
    expect(route.totalAmountOut).toEqual(0)
  } else if (basePricesAreSet) {
    const outPriceToBase = network.prices[parseInt(baseToken.name)] / network.prices[parseInt(to.name)]
    const expectedTotalAmountOut = route.amountOut - route.gasSpent * gasPrice * outPriceToBase
    expectToBeClose(route.totalAmountOut, expectedTotalAmountOut, MAX_POOL_IMBALANCE + 1e-7)
  } else {
    expect(route.totalAmountOut).toEqual(route.amountOut)
  }

  // legs checks
  if (route.status !== RouteStatus.NoWay) expect(route.legs.length).toBeGreaterThan(0)
  const usedPools = new Map<string, boolean>()
  const usedTokens = new Map<RToken, RouteLeg[]>()
  route.legs.forEach(l => {
    expect(usedPools.get(l.address)).toBeUndefined()
    usedPools.set(l.address, true)
    const pool = poolMap.get(l.address) as Pool
    usedTokens.set(pool.token0, usedTokens.get(pool.token0) || [])
    usedTokens.get(pool.token0)?.push(l)
    usedTokens.set(pool.token1, usedTokens.get(pool.token1) || [])
    usedTokens.get(pool.token1)?.push(l)
  })
  usedTokens.forEach((legs, t) => {
    if (t === from) {
      expect(legs.length).toBeGreaterThan(0)
      expect(legs.every(l => l.token === from)).toBeTruthy()
      expect(legs[legs.length - 1].swapPortion).toEqual(1)
    } else if (t === to) {
      expect(legs.length).toBeGreaterThan(0)
      expect(legs.some(l => l.token === to)).toBeFalsy()
    } else {
      expect(legs.length).toBeGreaterThanOrEqual(2)
      expect(legs[0].token).not.toEqual(t)
      expect(legs[legs.length - 1].token).toEqual(t)
      expect(legs[legs.length - 1].swapPortion).toEqual(1)
      let inputFlag = true
      let absolutePortion = 0
      legs.forEach(l => {
        if (l.token !== t) {
          expect(inputFlag).toBeTruthy()
        } else {
          inputFlag = false
          absolutePortion += l.absolutePortion
          expect(l.swapPortion).toBeGreaterThan(0)
          expect(l.swapPortion).toBeLessThanOrEqual(1)
        }
      })
      expectToBeClose(absolutePortion, 1, 1e-12)
    }
  })
}

// Just for testing
// @ts-ignore
function exportNetwork(network: Network, from: RToken, to: RToken, route: MultiRoute) {
  const allPools = new Map<string, Pool>()
  network.pools.forEach(p => allPools.set(p.address, p))
  const usedPools = new Map<string, boolean>()
  route.legs.forEach(l => usedPools.set(l.address, l.token === allPools.get(l.address)?.token0))

  function edgeStyle(p: Pool) {
    const u = usedPools.get(p.address)
    if (u === undefined) return ''
    if (u) return ', value: 2, arrows: "to"'
    else return ', value: 2, arrows: "from"'
  }

  function nodeLabel(t: RToken) {
    if (t === from) return `${t.name}: ${route.amountIn}`
    if (t === to) return `${t.name}: ${route.amountOut}`
    return t.name
  }

  const nodes = `var nodes = new vis.DataSet([
    ${network.tokens.map(t => `{ id: ${t.name}, label: "${nodeLabel(t)}"}`).join(',\n\t\t')}
  ]);\n`
  const edges = `var edges = new vis.DataSet([
    ${network.pools.map(p => `{ from: ${p.token0.name}, to: ${p.token1.name}${edgeStyle(p)}}`).join(',\n\t\t')}
  ]);\n`
  const data = `var data = {
      nodes: nodes,
      edges: edges,
  };\n`

  const fs = require('fs')
  fs.writeFileSync('D:/Info/Notes/GraphVisualization/data.js', nodes + edges + data)
}

const network = createNetwork(rnd, 20)
it('Token price calculation is correct', () => {
  const baseTokenIndex = 0
  const g = new Graph(network.pools, network.tokens[baseTokenIndex], network.gasPrice)
  g.vertices.forEach(v => {
    const tokenIndex = parseInt(v.token.name)
    if (tokenIndex === baseTokenIndex) {
      expectToBeClose(v.price, 1, 1e-10)
    }
    if (v.price !== 0) {
      expectToBeClose(
        v.price,
        network.prices[tokenIndex] / network.prices[baseTokenIndex],
        5 * (MAX_POOL_IMBALANCE - 1)
      )
    }
  })
})
debugger
it(`Multirouter output is correct for 20 tokens and ${network.pools.length} pools`, () => {
  for (var i = 0; i < 100; ++i) {
    const token0 = Math.floor(rnd() * 20)
    const token1 = (token0 + 1 + Math.floor(rnd() * 19)) % 20
    expect(token0).not.toEqual(token1)
    const tokenBase = Math.floor(rnd() * 20)
    const amountIn = getRandom(rnd, 1e6, 1e24)
    if (i !== 161) continue
    const route = findMultiRouting(
      network.tokens[token0],
      network.tokens[token1],
      amountIn,
      network.pools,
      network.tokens[tokenBase],
      network.gasPrice
    )
    exportNetwork(network, network.tokens[token0], network.tokens[token1], route)
    checkRoute(
      network,
      network.tokens[token0],
      network.tokens[token1],
      amountIn,
      network.tokens[tokenBase],
      network.gasPrice,
      route
    )
  }
})

// @ts-ignore
import seedrandom from 'seedrandom'
import { /*findMultiRouting,*/ Graph } from '../src/entities/MultiRouter'
import { RConstantProductPool, Pool, RToken } from '../src/types/MultiRouterTypes'
import { getBigNumber } from '../src/utils/MultiRouterMath'

const testSeed = '1' // Change it to change random generator values
const rnd: () => number = seedrandom(testSeed) // random [0, 1)

const GAS_PRICE = 1 * 200 * 1e-9
const TOKEN_NUMBER = 20
const MIN_TOKEN_PRICE = 1e-6
const MAX_TOKEN_PRICE = 1e6
const POOL_CP_DENSITY = 0.2
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
  if (total <= 0) throw 'Error 62'
  const val = rnd() * total
  let past = 0
  for (let k in obj) {
    past += obj[k]
    if (past >= val) return k
  }
  throw 'Error 70'
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
    const reduceRate = maxReserve / MAX_LIQUIDITY
    reserve0 /= reduceRate
    reserve1 /= reduceRate
  }
  const minReserve = Math.min(reserve0, reserve1)
  if (minReserve < MIN_LIQUIDITY) {
    const raseRate = MIN_LIQUIDITY / minReserve
    reserve0 *= raseRate
    reserve1 *= raseRate
  }
  console.assert(reserve0 >= MIN_LIQUIDITY && reserve0 <= MAX_LIQUIDITY, 'Error reserve0 clculation')
  console.assert(reserve1 >= MIN_LIQUIDITY && reserve1 <= MAX_LIQUIDITY, 'Error reserve1 clculation')

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

function createNetwork(rnd: () => number): Network {
  const tokens = []
  const prices = []
  for (var i = 0; i < TOKEN_NUMBER; ++i) {
    tokens.push({ name: '' + i, address: '' + i })
    prices.push(getTokenPrice(rnd))
  }

  const pools = []
  for (var i = 0; i < TOKEN_NUMBER; ++i) {
    for (var j = i + 1; j < TOKEN_NUMBER; ++j) {
      if (rnd() < POOL_CP_DENSITY) {
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

it('Token price calculation is correct', () => {
  const network = createNetwork(rnd)
  const baseTokenIndex = 0
  const g = new Graph(network.pools, network.tokens[baseTokenIndex], network.gasPrice)
  g.vertices.forEach(v => {
    const tokenIndex = parseInt(v.token.name)
    if (tokenIndex === baseTokenIndex) {
      expectToBeClose(v.price, 1, 1e-10)
    }
    if (v.price !== 0) {
      expectToBeClose(v.price, network.prices[tokenIndex] / network.prices[baseTokenIndex], 0.05)
    }
  })
})

// const res = findMultiRouting(network.tokens[0], network.tokens[3], 100000,
//     network.pools, network.tokens[2], network.gasPrice)
// console.log(res);

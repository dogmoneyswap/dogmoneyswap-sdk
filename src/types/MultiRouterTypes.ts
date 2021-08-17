import { BigNumber } from "@ethersproject/bignumber";

export interface RToken {
  name: string;
  address: string;
}

export enum PoolType {
  ConstantProduct = "ConstantProduct",
  Weighted = "Weighted",
  Hybrid = "Hybrid",
  ConcentratedLiquidity = "ConcentratedLiquidity"
}

export interface PoolInfo {
  address: string;
  token0: RToken;
  token1: RToken;
  type: PoolType;
  reserve0: BigNumber;
  reserve1: BigNumber;
  fee: number;
  minLiquidity: number;
  swapGasCost: number;
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type PoolInfoWithDefaults = PartialBy<PoolInfo, "minLiquidity" | "swapGasCost">;

export class Pool {
  address: string;
  token0: RToken;
  token1: RToken;
  type: PoolType;
  reserve0: BigNumber;
  reserve1: BigNumber;
  fee: number;
  minLiquidity: number;
  swapGasCost: number;

  constructor(_info: PoolInfoWithDefaults) {
    const info = {
      minLiquidity: 1000,
      swapGasCost: 40_000,
      ..._info
    };
    this.address = info.address;
    this.token0 = info.token0;
    this.token1 = info.token1;
    this.type = info.type;
    this.reserve0 = info.reserve0;
    this.reserve1 = info.reserve1;
    this.fee = info.fee;
    this.minLiquidity = info.minLiquidity;
    this.swapGasCost = info.swapGasCost;
  }
}

type PoolInfoNoType = Omit<PoolInfoWithDefaults, "type">;

export class ConstantProductPool extends Pool {
  constructor(info: PoolInfoNoType) {
    super({
      type: PoolType.ConstantProduct,
      ...info
    });
  }
}

type HybridPoolInfo = PoolInfoNoType & { A: number };

export class HybridPool extends Pool {
  A: number;
  constructor(info: HybridPoolInfo) {
    super({
      type: PoolType.Hybrid,
      ...info
    });
    this.A = info.A;
  }
}

type WeightedPoolInfo = PoolInfoNoType & { weight0: number; weight1: number };

export class WeightedPool extends Pool {
  weight0: number;
  weight1: number;
  constructor(info: WeightedPoolInfo) {
    super({
      type: PoolType.Weighted,
      ...info
    });
    this.weight0 = info.weight0;
    this.weight1 = info.weight1;
  }
}

export interface RouteLeg {
  address: string;
  token: RToken;
  swapPortion: number; // For router contract
  absolutePortion: number; // To depict at webpage for user
}

export interface MultiRoute {
  amountIn: number;
  amountOut: number;
  legs: RouteLeg[];
  gasSpent: number;
  totalAmountOut: number;
}

import { keccak256, pack } from "@ethersproject/solidity";

import { INIT_CODE_HASH } from "../constants";
// import { Percent } from 'entities'
import { Token } from "../entities/Token";
import { getCreate2Address } from "@ethersproject/address";

export const computePairAddress = ({
  factoryAddress,
  tokenA,
  tokenB
}: {
  factoryAddress: string;
  tokenA: Token;
  tokenB: Token;
}): string => {
  const [token0, token1] = tokenA.sortsBefore(tokenB)
    ? [tokenA, tokenB]
    : [tokenB, tokenA]; // does safety checks
  return getCreate2Address(
    factoryAddress,
    keccak256(
      ["bytes"],
      [pack(["address", "address"], [token0.address, token1.address])]
    ),
    INIT_CODE_HASH
  );
};

export enum FeeAmount {
  LOW = 500,
  MEDIUM = 3000,
  HIGH = 10000
}

const CONSTANT_PRODUCT_POOL_CREATION_CODE = "";

export const computeConstantProductPoolAddress = ({
  factoryAddress,
  tokenA,
  tokenB,
  fee
}: {
  factoryAddress: string;
  tokenA: Token;
  tokenB: Token;
  fee: FeeAmount;
}): string => {
  const [token0, token1] = tokenA.sortsBefore(tokenB)
    ? [tokenA, tokenB]
    : [tokenB, tokenA]; // does safety checks
  return getCreate2Address(
    factoryAddress,
    keccak256(
      ["bytes"],
      [
        pack(
          ["address", "address", "uint24"],
          [token0.address, token1.address, fee]
        )
      ]
    ),
    CONSTANT_PRODUCT_POOL_CREATION_CODE
  );
};

// const CONCENTRATED_LIQUIDITY_POOL_CREATION_CODE = ''

// export const computeConcentratedLiquidityPoolAddress = ({
//   factoryAddress,
//   tokenA,
//   tokenB,
//   fee,
// }: {
//   factoryAddress: string
//   tokenA: Token
//   tokenB: Token
//   fee: FeeAmount
// }): string => {
//   const [token0, token1] = tokenA.sortsBefore(tokenB)
//     ? [tokenA, tokenB]
//     : [tokenB, tokenA] // does safety checks
//   return getCreate2Address(
//     factoryAddress,
//     keccak256(
//       ['bytes'],
//       [
//         pack(
//           ['address', 'address', 'uint24'],
//           [token0.address, token1.address, fee]
//         ),
//       ]
//     ),
//     CONSTANT_PRODUCT_POOL_CREATION_CODE
//   )
// }

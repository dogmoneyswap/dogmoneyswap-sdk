import { ChainId } from '../enums'
import JSBI from 'jsbi'

export * from './addresses'
export * from './kashi'
export * from './natives'
export * from './numbers'
export * from './tokens'

export const INIT_CODE_HASH: { [chainId: number]: string } = {
  [ChainId.SMARTBCH]:       '0xacca68b46e4aa677641d8d20d81c9f4b252af83de62ff9e2fb58a9b648ee3537',
  [ChainId.SMARTBCH_AMBER]: '0xacca68b46e4aa677641d8d20d81c9f4b252af83de62ff9e2fb58a9b648ee3537',
  [ChainId.DOGECHAIN]:      '0x022c5c03794888783ccaeb987cd83b57b6e707f13c06fe761befb20653553b92',
}

export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000)

export enum SolidityType {
  uint8 = 'uint8',
  uint256 = 'uint256'
}

export const SOLIDITY_TYPE_MAXIMA = {
  [SolidityType.uint8]: JSBI.BigInt('0xff'),
  [SolidityType.uint256]: JSBI.BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
}

export const LAMBDA_URL = 'https://9epjsvomc4.execute-api.us-east-1.amazonaws.com/dev'

export const SOCKET_URL = 'wss://hfimt374ge.execute-api.us-east-1.amazonaws.com/dev'

import { FLEXUSD_ADDRESS, WETH9_ADDRESS } from './addresses'

import { ChainId } from '../enums'
import { Token } from '../entities/Token'
import { TokenMap } from '../types/TokenMap'

export const FLEXUSD: TokenMap = {
  [ChainId.SMARTBCH]: new Token(ChainId.SMARTBCH, FLEXUSD_ADDRESS[ChainId.SMARTBCH], 18, 'flexUSD', 'flexUSD')
}

export const WETH9: TokenMap = {
  [ChainId.SMARTBCH]: new Token(ChainId.SMARTBCH, WETH9_ADDRESS[ChainId.SMARTBCH], 18, 'BCH', 'Bitcoin Cash'),
  [ChainId.SMARTBCH_AMBER]: new Token(ChainId.SMARTBCH_AMBER, WETH9_ADDRESS[ChainId.SMARTBCH_AMBER], 18, 'TBCH', 'Bitcoin Cash')
}

export const WNATIVE: TokenMap = {
  [ChainId.SMARTBCH]: WETH9[ChainId.SMARTBCH],
  [ChainId.SMARTBCH_AMBER]: WETH9[ChainId.SMARTBCH_AMBER]
}

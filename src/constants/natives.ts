import { SmartBCH } from '../entities/Native'

import { ChainId } from '../enums'

export const NATIVE = {
  [ChainId.SMARTBCH]: SmartBCH.onChain(ChainId.SMARTBCH),
  [ChainId.SMARTBCH_AMBER]: SmartBCH.onChain(ChainId.SMARTBCH_AMBER),
  [ChainId.DOGECHAIN]: SmartBCH.onChain(ChainId.DOGECHAIN),
}

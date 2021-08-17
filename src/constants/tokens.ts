import { WETH9_ADDRESS, WNATIVE_ADDRESS } from "./addresses";

import { ChainId } from "../enums";
import { Token } from "../entities/Token";

export const WETH9: { [chainId: number]: Token } = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    WETH9_ADDRESS[ChainId.MAINNET],
    18,
    "WETH9",
    "Wrapped Ether"
  ),
  [ChainId.ROPSTEN]: new Token(
    ChainId.ROPSTEN,
    WETH9_ADDRESS[ChainId.ROPSTEN],
    18,
    "WETH9",
    "Wrapped Ether"
  ),
  [ChainId.RINKEBY]: new Token(
    ChainId.RINKEBY,
    WETH9_ADDRESS[ChainId.RINKEBY],
    18,
    "WETH9",
    "Wrapped Ether"
  ),
  [ChainId.GÖRLI]: new Token(
    ChainId.GÖRLI,
    WETH9_ADDRESS[ChainId.GÖRLI],
    18,
    "WETH9",
    "Wrapped Ether"
  ),
  [ChainId.KOVAN]: new Token(
    ChainId.KOVAN,
    WETH9_ADDRESS[ChainId.KOVAN],
    18,
    "WETH9",
    "Wrapped Ether"
  ),
  [ChainId.ARBITRUM]: new Token(
    ChainId.ARBITRUM,
    WETH9_ADDRESS[ChainId.ARBITRUM],
    18,
    "WETH9",
    "Wrapped Ether"
  ),
  [ChainId.ARBITRUM_TESTNET]: new Token(
    ChainId.ARBITRUM_TESTNET,
    WETH9_ADDRESS[ChainId.ARBITRUM_TESTNET],
    18,
    "WETH",
    "Wrapped Ether"
  ),

  [ChainId.BSC]: new Token(
    ChainId.BSC,
    WETH9_ADDRESS[ChainId.BSC],
    18,
    "WETH",
    "Wrapped Ether"
  ),

  [ChainId.FANTOM]: new Token(
    ChainId.FANTOM,
    WETH9_ADDRESS[ChainId.FANTOM],
    18,
    "WETH",
    "Wrapped Ether"
  ),

  [ChainId.MATIC]: new Token(
    ChainId.MATIC,
    WETH9_ADDRESS[ChainId.MATIC],
    18,
    "WETH",
    "Wrapped Ether"
  ),

  [ChainId.OKEX]: new Token(
    ChainId.OKEX,
    WETH9_ADDRESS[ChainId.OKEX],
    18,
    "WETH",
    "Wrapped Ether"
  ),

  [ChainId.HECO]: new Token(
    ChainId.HECO,
    WETH9_ADDRESS[ChainId.HECO],
    18,
    "WETH",
    "Wrapped Ether"
  ),

  [ChainId.HARMONY]: new Token(
    ChainId.HARMONY,
    WETH9_ADDRESS[ChainId.HARMONY],
    18,
    "WETH",
    "Wrapped Ether"
  ),

  [ChainId.XDAI]: new Token(
    ChainId.XDAI,
    WETH9_ADDRESS[ChainId.XDAI],
    18,
    "WETH",
    "Wrapped Ether"
  ),

  [ChainId.AVALANCHE]: new Token(
    ChainId.AVALANCHE,
    WETH9_ADDRESS[ChainId.AVALANCHE],
    18,
    "WETH",
    "Wrapped Ether"
  )
};

export const WNATIVE: { [chainId: number]: Token } = {
  [ChainId.MAINNET]: WETH9[ChainId.MAINNET],
  [ChainId.ROPSTEN]: WETH9[ChainId.ROPSTEN],
  [ChainId.RINKEBY]: WETH9[ChainId.RINKEBY],
  [ChainId.GÖRLI]: WETH9[ChainId.GÖRLI],
  [ChainId.KOVAN]: WETH9[ChainId.KOVAN],
  [ChainId.FANTOM]: new Token(
    ChainId.FANTOM,
    WNATIVE_ADDRESS[ChainId.FANTOM],
    18,
    "WFTM",
    "Wrapped FTM"
  ),
  [ChainId.FANTOM_TESTNET]: new Token(
    ChainId.FANTOM_TESTNET,
    WNATIVE_ADDRESS[ChainId.FANTOM_TESTNET],
    18,
    "FTM",
    "Wrapped FTM"
  ),
  [ChainId.MATIC]: new Token(
    ChainId.MATIC,
    WNATIVE_ADDRESS[ChainId.MATIC],
    18,
    "WMATIC",
    "Wrapped Matic"
  ),
  [ChainId.MATIC_TESTNET]: new Token(
    ChainId.MATIC_TESTNET,
    WNATIVE_ADDRESS[ChainId.MATIC_TESTNET],
    18,
    "WMATIC",
    "Wrapped Matic"
  ),
  [ChainId.XDAI]: new Token(
    ChainId.XDAI,
    WNATIVE_ADDRESS[ChainId.XDAI],
    18,
    "WXDAI",
    "Wrapped xDai"
  ),
  [ChainId.BSC]: new Token(
    ChainId.BSC,
    WNATIVE_ADDRESS[ChainId.BSC],
    18,
    "WBNB",
    "Wrapped BNB"
  ),
  [ChainId.BSC_TESTNET]: new Token(
    ChainId.BSC_TESTNET,
    WNATIVE_ADDRESS[ChainId.BSC_TESTNET],
    18,
    "WBNB",
    "Wrapped BNB"
  ),
  [ChainId.ARBITRUM]: WETH9[ChainId.ARBITRUM],
  [ChainId.ARBITRUM_TESTNET]: WETH9[ChainId.ARBITRUM_TESTNET],
  [ChainId.MOONBEAM_TESTNET]: new Token(
    ChainId.MOONBEAM_TESTNET,
    WNATIVE_ADDRESS[ChainId.MOONBEAM_TESTNET],
    18,
    "WETH",
    "Wrapped Ether"
  ),
  [ChainId.AVALANCHE]: new Token(
    ChainId.AVALANCHE,
    WNATIVE_ADDRESS[ChainId.AVALANCHE],
    18,
    "WAVAX",
    "Wrapped AVAX"
  ),
  [ChainId.AVALANCHE_TESTNET]: new Token(
    ChainId.AVALANCHE_TESTNET,
    WNATIVE_ADDRESS[ChainId.AVALANCHE_TESTNET],
    18,
    "WAVAX",
    "Wrapped AVAX"
  ),
  [ChainId.HECO]: new Token(
    ChainId.HECO,
    WNATIVE_ADDRESS[ChainId.HECO],
    18,
    "WHT",
    "Wrapped HT"
  ),
  [ChainId.HECO_TESTNET]: new Token(
    ChainId.HECO_TESTNET,
    WNATIVE_ADDRESS[ChainId.HECO_TESTNET],
    18,
    "WHT",
    "Wrapped HT"
  ),
  [ChainId.HARMONY]: new Token(
    ChainId.HARMONY,
    WNATIVE_ADDRESS[ChainId.HARMONY],
    18,
    "WONE",
    "Wrapped ONE"
  ),
  [ChainId.HARMONY_TESTNET]: new Token(
    ChainId.HARMONY_TESTNET,
    WNATIVE_ADDRESS[ChainId.HARMONY_TESTNET],
    18,
    "WONE",
    "Wrapped ONE"
  ),
  [ChainId.OKEX]: new Token(
    ChainId.OKEX,
    WNATIVE_ADDRESS[ChainId.OKEX],
    18,
    "WOKT",
    "Wrapped OKExChain"
  ),
  [ChainId.OKEX_TESTNET]: new Token(
    ChainId.OKEX_TESTNET,
    WNATIVE_ADDRESS[ChainId.OKEX_TESTNET],
    18,
    "WOKT",
    "Wrapped OKExChain"
  ),
  [ChainId.CELO]: new Token(
    ChainId.CELO,
    WNATIVE_ADDRESS[ChainId.CELO],
    18,
    "CELO",
    "Celo"
  ),
  [ChainId.PALM]: new Token(
    ChainId.PALM,
    WNATIVE_ADDRESS[ChainId.PALM],
    18,
    "WPALM",
    "Wrapped Palm"
  )
};

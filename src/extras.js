import { createStewardAgent } from '@sodazone/ocelloids-client'

import { apiKey, httpUrl } from './env.js'
import { withRetry } from './utils.js'

const BASE_CDN =
  'https://cdn.jsdelivr.net/gh/sodazone/intergalactic-asset-metadata'
const BASE_ASSETS_URL = `${BASE_CDN}/v2`

const cacheAssetIcons = {}
const cacheChainIcons = {}

let AssetIcons
let ChainIcons

export let NetworkInfos

const ExtraChains = [
  {
    runtimeChain: 'Ethereum Mainnet',
    chainDecimals: [18],
    chainTokens: ['ETH'],
    urn: 'urn:ocn:ethereum:1',
  },
  {
    runtimeChain: 'Ethereum Sepolia (Testnet)',
    chainDecimals: [18],
    chainTokens: ['ETH'],
    urn: 'urn:ocn:ethereum:11155111',
  },
  {
    runtimeChain: 'Wormhole',
    urn: 'urn:ocn:wormhole:1',
  },
  {
    runtimeChain: 'Sui',
    urn: 'urn:ocn:sui:0x35834a8a',
  },
  {
    runtimeChain: 'Solana',
    urn: 'urn:ocn:solana:101',
  },
  {
    runtimeChain: 'Celo',
    urn: 'urn:ocn:ethereum:42220',
  },
  {
    runtimeChain: 'Base',
    urn: 'urn:ocn:ethereum:8453',
  },
  {
    runtimeChain: 'Arbitrum',
    urn: 'urn:ocn:ethereum:42161',
  },
  {
    runtimeChain: 'Optimism',
    urn: 'urn:ocn:ethereum:10',
  },
  {
    runtimeChain: 'BNB Chain',
    urn: 'urn:ocn:ethereum:56',
  },
  {
    runtimeChain: 'Polygon',
    urn: 'urn:ocn:ethereum:137',
  },
  {
    runtimeChain: 'Avalanche',
    urn: 'urn:ocn:ethereum:43114',
  },
  {
    runtimeChain: 'Fantom',
    urn: 'urn:ocn:ethereum:250',
  },
  {
    runtimeChain: 'Moonbeam',
    urn: 'urn:ocn:ethereum:1284',
  },
  {
    runtimeChain: 'Moonriver',
    urn: 'urn:ocn:ethereum:1285',
  },
  {
    runtimeChain: 'Harmony',
    urn: 'urn:ocn:ethereum:1666600000',
  },
]

async function fetchNetworkInfos() {
  const networkMap = {}
  const steward = createStewardAgent({
    httpUrl,
    apiKey,
  })

  async function _stewardFetch(cursor) {
    const { items, pageInfo } = await steward.query(
      {
        op: 'chains.list',
      },
      { limit: 100, cursor }
    )
    for (const chainInfo of items) {
      networkMap[chainInfo.urn] = chainInfo
    }
    if (pageInfo?.hasNextPage) {
      await withRetry(async () => _stewardFetch(pageInfo.endCursor))()
    }
    return networkMap
  }

  await withRetry(_stewardFetch)()

  for (const chain of ExtraChains) {
    networkMap[chain.urn] = chain
  }

  return networkMap
}

export async function loadExtraInfos() {
  const fetchAssetsExtra = withRetry(async () => {
    const response = await fetch(`${BASE_CDN}/assets-v2.json`)
    return await response.json()
  })
  const fetchNetworksExtra = withRetry(async () => {
    const response = await fetch(`${BASE_CDN}/chains-v2.json`)
    return await response.json()
  })
  const [assetsExtras, chainsExtras, networkInfos] = await Promise.all([
    fetchAssetsExtra(),
    fetchNetworksExtra(),
    fetchNetworkInfos(),
  ])
  AssetIcons = assetsExtras.items
  ChainIcons = chainsExtras.items
  NetworkInfos = networkInfos
}

export function resolveNetworkIcon(networkUrn) {
  if (cacheChainIcons[networkUrn]) {
    return cacheChainIcons[networkUrn]
  }

  const urnParts =
    networkUrn.indexOf(':') > 0
      ? networkUrn.split(':')
      : ['', '', networkUrn, '0']
  const path = `${urnParts[2]}/${urnParts[3]}`
  const icon = ChainIcons.find((p) => {
    return p.substring(0, p.lastIndexOf('/')) === path
  })

  cacheChainIcons[networkUrn] = icon ? `${BASE_ASSETS_URL}/${icon}` : null

  return cacheChainIcons[networkUrn]
}

export function resolveNetworkName(networkUrn) {
  return NetworkInfos[networkUrn]?.runtimeChain
}

export function resolveAssetIcon(key) {
  if (key.indexOf('|') < 0) {
    return
  }

  const [chainId, assetId] = key.split('|')
  if (cacheAssetIcons[key]) {
    return {
      assetIconUrl: cacheAssetIcons[key],
      chainIconUrl: assetId.startsWith('native')
        ? undefined
        : resolveNetworkIcon(chainId),
    }
  }

  const assetPath = assetId === '' ? 'native' : assetId.split(':').join('/')
  const path =
    `${chainId.substring(8).split(':').join('/')}/assets/${assetPath}`.toLowerCase()

  const icon = AssetIcons.find((p) => {
    return p.substring(0, p.lastIndexOf('/')) === path
  })

  cacheAssetIcons[key] = icon ? `${BASE_ASSETS_URL}/${icon}` : undefined
  return {
    assetIconUrl: cacheAssetIcons[key],
    chainIconUrl: assetId.startsWith('native')
      ? undefined
      : resolveNetworkIcon(chainId),
  }
}

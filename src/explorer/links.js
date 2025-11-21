const EXPLORERS = {
  'urn:ocn:polkadot:0': {
    type: 'subscan',
    url: 'https://polkadot.subscan.io',
  },
  'urn:ocn:polkadot:1000': {
    type: 'subscan',
    url: 'https://assethub-polkadot.subscan.io',
  },
  'urn:ocn:polkadot:1002': {
    type: 'subscan',
    url: 'https://bridgehub-polkadot.subscan.io',
  },
  'urn:ocn:polkadot:1005': {
    type: 'subscan',
    url: 'https://coretime-polkadot.subscan.io',
  },
  'urn:ocn:polkadot:2000': {
    type: 'subscan',
    url: 'https://acala.subscan.io',
  },
  'urn:ocn:polkadot:2004': [
    {
      type: 'subscan',
      url: 'https://moonbeam.subscan.io',
    },
    {
      type: 'etherscan',
      url: 'https://moonscan.io',
    },
  ],
  'urn:ocn:polkadot:2006': {
    type: 'subscan',
    url: 'https://astar.subscan.io',
  },
  'urn:ocn:polkadot:2030': {
    type: 'subscan',
    url: 'https://bifrost.subscan.io',
  },
  'urn:ocn:polkadot:2031': {
    type: 'subscan',
    url: 'https://centrifuge.subscan.io',
  },
  'urn:ocn:polkadot:2034': {
    type: 'subscan',
    url: 'https://hydration.subscan.io',
  },
  'urn:ocn:polkadot:2035': {
    type: 'subscan',
    url: 'https://phala.subscan.io',
  },
  'urn:ocn:polkadot:3369': {
    type: 'subscan',
    url: 'https://mythos.subscan.io',
  },
  'urn:ocn:kusama:0': {
    type: 'subscan',
    url: 'https://kusama.subscan.io',
  },
  'urn:ocn:kusama:1000': {
    type: 'subscan',
    url: 'https://assethub-kusama.subscan.io',
  },
  'urn:ocn:kusama:1002': {
    type: 'subscan',
    url: 'https://bridgehub-kusama.subscan.io',
  },
  'urn:ocn:kusama:1005': {
    type: 'subscan',
    url: 'https://coretime-kusama.subscan.io',
  },
  'urn:ocn:ethereum:8453': {
    type: 'etherscan',
    url: 'https://basescan.io',
  },
  'urn:ocn:ethereum:56': {
    type: 'etherscan',
    url: 'https://bscscan.com',
  },
  'urn:ocn:ethereum:42161': {
    type: 'etherscan',
    url: 'https://arbiscan.io',
  },
  'urn:ocn:ethereum:42220': {
    type: 'etherscan',
    url: 'https://celoscan.io',
  },
  'urn:ocn:ethereum:137': {
    type: 'etherscan',
    url: 'https://polygonscan.com',
  },
  'urn:ocn:ethereum:1': {
    type: 'etherscan',
    url: 'https://etherscan.io',
  },
  'urn:ocn:ethereum:10': {
    type: 'etherscan',
    url: 'https://optimistic.etherscan.io',
  },
  'urn:ocn:solana:101': {
    type: 'solscan',
    url: 'https://solscan.io',
  },
  'urn:ocn:sui:0x35834a8a': {
    type: 'suivision',
    url: 'https://suivision.xyz',
  },
}

const EXPLORER_VERBS = {
  subscan: {
    address: 'address',
    block: 'block',
    tx: 'extrinsic',
  },
  etherscan: {
    address: 'address',
    block: 'block',
    tx: 'tx',
  },
  solscan: {
    address: 'account',
    block: 'block',
    tx: 'tx',
  },
  suivision: {
    address: 'account',
    block: 'block',
    tx: 'txblock',
  },
}

function resolveURL(chainId, verb, param, pref) {
  const explorers = EXPLORERS[chainId]
  let resolved = null
  if (Array.isArray(explorers)) {
    resolved =
      pref == null
        ? explorers[0]
        : (explorers.find((x) => x.type == pref) ?? explorers[0])
  } else {
    resolved = explorers
  }
  if (resolved) {
    switch (resolved.type) {
      case 'subscan':
      case 'etherscan':
      case 'solscan':
      case 'suivision':
        return `${resolved.url}/${EXPLORER_VERBS[resolved.type][verb]}/${param ?? '#'}`
    }
  }
  return null
}

export function getExplorerTxLink(chainId, hash, pref) {
  return resolveURL(chainId, 'tx', hash, pref)
}

export function getExplorerBlockLink(chainId, blockNumber, pref) {
  return resolveURL(chainId, 'block', blockNumber, pref)
}

const USE_FORMATTED_ADDRESS = ['urn:ocn:solana:101']

export function getExplorerAddressLink(
  chainId,
  address,
  addressFormatted,
  pref
) {
  return resolveURL(
    chainId,
    'address',
    USE_FORMATTED_ADDRESS.includes(chainId) ? addressFormatted : address,
    pref
  )
}

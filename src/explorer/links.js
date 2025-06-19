const SUBSCAN = {
  'urn:ocn:polkadot:0': 'https://polkadot.subscan.io',
  'urn:ocn:polkadot:1000': 'https://assethub-polkadot.subscan.io',
  'urn:ocn:polkadot:1002': 'https://bridgehub-polkadot.subscan.io',
  'urn:ocn:polkadot:1005': 'https://coretime-polkadot.subscan.io',
  'urn:ocn:polkadot:2000': 'https://acala.subscan.io',
  'urn:ocn:polkadot:2004': 'https://moonbeam.subscan.io',
  'urn:ocn:polkadot:2006': 'https://astar.subscan.io',
  'urn:ocn:polkadot:2030': 'https://bifrost.subscan.io',
  'urn:ocn:polkadot:2031': 'https://centrifuge.subscan.io',
  'urn:ocn:polkadot:2034': 'https://hydration.subscan.io',
  'urn:ocn:polkadot:2035': 'https://phala.subscan.io',
  'urn:ocn:polkadot:3369': 'https://mythos.subscan.io',
  'urn:ocn:kusama:0': 'https://kusama.subscan.io',
  'urn:ocn:kusama:1000': 'https://assethub-kusama.subscan.io',
  'urn:ocn:kusama:1002': 'https://bridgehub-kusama.subscan.io',
  'urn:ocn:kusama:1005': 'https://coretime-kusama.subscan.io',
}

function resolveURL(chainId, path, param) {
  const base = SUBSCAN[chainId]
  if (base) {
    return `${base}/${path}/${param}`
  }
  return null
}

export function getSubscanExtrinsicLink(chainId, hash) {
  return resolveURL(chainId, 'extrinsic', hash)
}

export function getSubscanBlockLink(chainId, blockNumber) {
  return resolveURL(chainId, 'block', blockNumber)
}

export function getSubscanAddressLink(chainId, address) {
  return resolveURL(chainId, 'address', address)
}

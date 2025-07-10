function resolveChainType(networkURN) {
  switch (networkURN) {
    case 'urn:ocn:polkadot:0':
    case 'urn:ocn:kusama:0':
    case 'urn:ocn:paseo:0':
      return 'relay'
    case 'urn:ocn:polkadot:1002':
    case 'urn:ocn:kusama:1002':
    case 'urn:ocn:paseo:1002':
      return 'bridgehub'
    default:
      return 'parachain'
  }
}

export function computeFIS(data, keys, network) {
  const { totalKey } = keys
  const computeDFI = computeDFIFrom(keys)
  const volumes = data
    .map((d) => d[totalKey])
    .filter((v) => typeof v === 'number')
  const sorted = [...volumes].sort((a, b) => a - b)

  return data.map((row) => {
    const vol = row[totalKey]
    if (typeof vol !== 'number') {
      return { ...row, volumePercentile: null }
    }

    const rank = sorted.findIndex((v) => v >= vol)
    const percentile = rank / (sorted.length - 1)
    const dfi = computeDFI(row)
    const networkURN = network ?? row.network
    const chainType = resolveChainType(networkURN)
    const flowLabel = classifyFlow(dfi, percentile, chainType)

    return {
      ...row,
      fis: {
        percentile: +percentile.toFixed(3),
        dfi,
        label: flowLabel,
        score: flowScore(flowLabel),
      },
    }
  })
}

export function computeDFIFrom({
  netflowKey = 'netflow',
  totalKey = 'total',
  decimals = 2,
} = {}) {
  return (row) => {
    const net = row[netflowKey]
    const total = row[totalKey]
    if (typeof net !== 'number' || typeof total !== 'number' || total === 0) {
      return null
    }
    return +(net / total).toFixed(decimals)
  }
}

// Reverse interpretation
const REVERSE_NETWORK_TYPES = ['relay', 'bridgehub']

function classifyFlow(dfi, percentile, chainType) {
  if (dfi == null || percentile == null) return null

  let dfiName

  if (REVERSE_NETWORK_TYPES.includes(chainType)) {
    if (dfi < -0.5) dfiName = 'up'
    else if (dfi < -0.1) dfiName = 'in'
    else if (dfi <= 0.1) dfiName = 'eq'
    else if (dfi <= 0.5) dfiName = 'out'
    else dfiName = 'down'
  } else {
    if (dfi > 0.5) dfiName = 'up'
    else if (dfi > 0.1) dfiName = 'in'
    else if (dfi >= -0.1) dfiName = 'eq'
    else if (dfi >= -0.5) dfiName = 'out'
    else dfiName = 'down'
  }

  let volName
  if (percentile > 0.7) volName = 'strong'
  else if (percentile >= 0.3) volName = 'neutral'
  else volName = 'weak'

  return `${dfiName}_${volName}`
}

function flowScore(label) {
  const map = {
    up_strong: 3,
    up_neutral: 2,
    up_weak: 1,
    in_strong: 2,
    in_neutral: 1,
    in_weak: 0.5,
    eq_strong: 0,
    eq_neutral: 0,
    eq_weak: 0,
    out_weak: -0.5,
    out_neutral: -1,
    out_strong: -2,
    down_weak: -1,
    down_neutral: -2,
    down_strong: -3,
  }
  return map[label] ?? 0
}

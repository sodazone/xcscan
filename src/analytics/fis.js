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
    case 'urn:ocn:polkadot:1000':
    case 'urn:ocn:kusama:1000':
    case 'urn:ocn:paseo:1000':
      return 'relay'
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

    let percentile
    if (sorted.length === 1) {
      percentile = 0.5
    } else {
      const rank = sorted.findIndex((v) => v >= vol)
      // if all values are the same, findIndex might return 0 for all, so fallback to last index
      const adjustedRank = rank === -1 ? sorted.length - 1 : rank
      percentile = adjustedRank / (sorted.length - 1)
    }

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
        score: flowScore(flowLabel.replace('rev_', '')),
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

  let dfiName = ''

  if (REVERSE_NETWORK_TYPES.includes(chainType)) {
    dfiName += 'rev_'
    if (dfi < -0.5) dfiName += 'up'
    else if (dfi < -0.1) dfiName += 'in'
    else if (dfi <= 0.1) dfiName += 'eq'
    else if (dfi <= 0.5) dfiName += 'out'
    else dfiName += 'down'
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
    up_strong: 5,
    in_strong: 5,

    up_neutral: 4,
    in_neutral: 4,

    up_weak: 1,
    in_weak: 1,

    eq_strong: 3,
    eq_neutral: 0.5,
    eq_weak: -1,

    out_strong: 2,
    out_neutral: 0,
    out_weak: -1,

    down_strong: 2,
    down_neutral: 2,
    down_weak: -1,
  }
  return map[label] ?? 0
}

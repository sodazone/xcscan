
export function computeFIS(data, volumeKey, computeDFI) {
  const volumes = data
    .map((d) => d[volumeKey])
    .filter((v) => typeof v === 'number')
  const sorted = [...volumes].sort((a, b) => a - b)

  return data.map((row) => {
    const vol = row[volumeKey]
    if (typeof vol !== 'number') {
      return { ...row, volumePercentile: null }
    }

    const rank = sorted.findIndex((v) => v >= vol)
    const percentile = rank / (sorted.length - 1)
    return {
      ...row,
      fis: {
        percentile: +percentile.toFixed(3),
        dfi: computeDFI(row),
      },
    }
  })
}

const flowLabels = {
  up_strong: 'Power Surge',
  up_neutral: 'Strong Uptick',
  up_weak: 'Quiet Accumulation',

  in_strong: 'Buoyant Demand',
  in_neutral: 'Moderate Inflow',
  in_weak: 'Subtle Interest',

  eq_strong: 'Heavy Equilibrium',
  eq_neutral: 'Steady State',
  eq_weak: 'Dormant Market',

  out_strong: 'Gentle Unloading',
  out_neutral: 'Light Outflow',
  out_weak: 'Fading Interest',

  down_strong: 'Panic Exit',
  down_neutral: 'Strong Outflow',
  down_weak: 'Quiet Dumping',
}

function classifyFlow(dfi, percentile) {
  if (dfi == null || percentile == null) {
    return null
  }

  let dfiName
  if (dfi > 0.5) dfiName = 'up'
  else if (dfi > 0.1) dfiName = 'in'
  else if (dfi >= -0.1) dfiName = 'eq'
  else if (dfi >= -0.5) dfiName = 'out'
  else dfiName = 'down'

  let volName
  if (percentile > 0.7) volName = 'strong'
  else if (percentile >= 0.3) volName = 'neutral'
  else volName = 'weak'

  return `${dfiName}_${volName}`
}

export function fsiCellRenderer({value: {dfi, percentile}}) {
  const prefix =  classifyFlow(dfi, percentile)
  if(prefix == null) {
    return ''
  }

  const label = flowLabels[prefix]
  return `<span class="truncate text-white/80">${label}</span>` // `<span class="flex items-center h-full" title="${label}"><img class="size-6" src="/icons/${prefix}-min.svg" alt="${label}"/></span>`
}
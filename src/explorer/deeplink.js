const deeplinkHandlers = {
  o: (filters, value) => {
    filters.selectedOrigins.push(value)
  },
  d: (filters, value) => {
    filters.selectedDestinations.push(value)
  },
  c: (filters, value) => {
    filters.selectedChains.push(value)
  },
  s: (filters, value) => {
    filters.selectedStatus.push(value)
  },
  x: (filters, value) => {
    filters.selectedActions.push(value)
  },
  t: (filters, value) => {
    filters.selectedAssets.push(value)
  },
  p: (filters, value) => {
    const normalizedValue = value.toLowerCase()

    if (normalizedValue === 'pkbridge') {
      filters.chainPairMode = true

      const polkadot = 'urn:ocn:polkadot:1000'
      const kusama = 'urn:ocn:kusama:1000'

      filters.selectedOrigins.push(polkadot, kusama)
      filters.selectedDestinations.push(polkadot, kusama)
    } else {
      filters.selectedProtocols.push(normalizedValue)
    }
  },
  u: (filters, value) => {
    // patterns:
    // preset:      u:presetName
    // >= amount:   u:gte:1000
    // <= amount:   u:lte:50000
    const parts = value.split(':')

    if (parts.length === 1) {
      filters.selectedUsdAmounts.amountPreset = parts[0]
      return
    }

    const [op, amount] = parts
    if (op === 'gte') filters.selectedUsdAmounts.amountGte = Number(amount)
    if (op === 'lte') filters.selectedUsdAmounts.amountLte = Number(amount)
  },
}

function buildDeeplinkQuery(filters) {
  const params = new URLSearchParams()

  if (filters.currentSearchTerm) {
    params.set('search', filters.currentSearchTerm)
  }

  const push = (prefix, value) => {
    if (value != null && value !== '') {
      params.append('filterBy', `${prefix}:${value}`)
    }
  }

  for (const v of filters.selectedOrigins) push('o', v)
  for (const v of filters.selectedDestinations) push('d', v)

  for (const v of filters.selectedChains) push('c', v)

  for (const v of filters.selectedStatus) push('s', v)

  for (const v of filters.selectedActions) push('x', v)

  for (const v of filters.selectedAssets) push('t', v)

  for (const v of filters.selectedProtocols) push('p', v)

  const usd = filters.selectedUsdAmounts
  if (usd.amountPreset) push('u', usd.amountPreset)
  if (usd.amountGte != null) push('u', `gte:${usd.amountGte}`)
  if (usd.amountLte != null) push('u', `lte:${usd.amountLte}`)

  return params
}

export function updateUrlFromFilters(filters) {
  const params = buildDeeplinkQuery(filters)
  let newUrl = window.location.pathname
  if (params.size > 0) {
    newUrl += `?${params.toString()}`
  }

  // replaceState = no new history entry
  window.history.replaceState({}, '', newUrl)
}

export function resolveDeeplinkFilters(filters, params) {
  if (!Array.isArray(params) || params.length === 0) return

  for (const rawParam of params) {
    const param = rawParam.trim()
    if (!param) continue

    const match = /^([a-z]):(.+)$/.exec(param)
    if (!match) continue

    const [, prefix, value] = match
    const handler = deeplinkHandlers[prefix]

    if (handler) {
      handler(filters, value)
    } else {
      console.warn(`Unknown deeplink prefix: ${prefix}`)
    }
  }

  // OD selections override chain selection
  if (
    filters.selectedOrigins.length > 0 ||
    filters.selectedDestinations.length > 0
  ) {
    filters.selectedChains.length = 0
    filters.chainPairMode = true
  }
}

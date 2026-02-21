import { fetchWithRetry } from '../../api.js'
import { httpUrl } from '../../env.js'
import { hasLocalStorage } from '../common.js'

const sseUrl = `${httpUrl}/sse/transfers/default`
const queryUrl = `${httpUrl}/query/transfers`

const CACHE_EXPIRY_MS = 3_600_000
const MAX_ASSETS = 200

async function _fetch(args) {
  return await fetchWithRetry(queryUrl, args)
}

function asIcCriteria(filters) {
  const {
    currentSearchTerm,
    selectedChains,
    selectedAssets,
    selectedUsdAmounts,
    selectedTypes,
  } = filters

  const criteria = {}

  if (currentSearchTerm) {
    const trimmed = currentSearchTerm.trim()
    if (trimmed.length > 2 && trimmed.length < 100) {
      const prefixMatch = /^([at]):(.+)$/.exec(trimmed)
      if (prefixMatch) {
        const [, prefix, value] = prefixMatch
        if (prefix === 'a') criteria.address = value
        else if (prefix === 't') criteria.txHash = value.toLowerCase()
      } else if (trimmed.startsWith('0x')) {
        const byteLength = (trimmed.length - 2) / 2
        if (byteLength === 20) {
          criteria.address = trimmed.toLowerCase()
        } else if (byteLength === 32) {
          criteria.txHash = trimmed
        }
      } else {
        criteria.address = trimmed
      }
    }
  }

  if (selectedChains?.length) {
    criteria.networks = [...selectedChains]
  }

  if (selectedAssets?.length) {
    criteria.assets = [...selectedAssets]
  }

  if (selectedTypes?.length) {
    criteria.types = [...selectedTypes]
  }

  const { amountPreset, amountGte, amountLte } = selectedUsdAmounts || {}

  if (amountPreset != null || amountGte != null || amountLte != null) {
    if (amountPreset) {
      if (amountPreset.includes('-')) {
        const [min, max] = amountPreset.split('-').map(Number)
        if (!isNaN(min)) criteria.usdAmountGte = min
        if (!isNaN(max)) criteria.usdAmountLte = max
      } else if (amountPreset.includes('+')) {
        const min = parseFloat(amountPreset.replace('+', ''))
        if (!isNaN(min)) criteria.usdAmountGte = min
      }
    } else {
      if (amountGte != null) criteria.usdAmountGte = amountGte
      if (amountLte != null) criteria.usdAmountLte = amountLte
    }
  }

  return criteria
}

export async function listTransfers({ filters, pagination }) {
  try {
    const criteria = asIcCriteria(filters)
    return await _fetch({
      args: {
        op: 'transfers.list',
        criteria,
      },
      pagination,
    })
  } catch (error) {
    console.error(error.message)
  }
}

export async function getTransferById(id) {
  try {
    return await _fetch({
      args: {
        op: 'transfers.by_id',
        criteria: {
          id,
        },
      },
    })
  } catch (error) {
    console.error(error.message)
  }
}

export async function _fetchFilterableNetworks() {
  try {
    const { items } = await _fetch({
      args: {
        op: 'networks.list',
      },
    })
    return items
  } catch (error) {
    console.error(error.message)
  }
}

export async function fetchFilterableNetworks() {
  if (hasLocalStorage()) {
    const cacheKey = 'icTransfersCache_filterable_networks'
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { timestamp, data } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
        return data
      }
    }

    const data = await _fetchFilterableNetworks()
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ timestamp: Date.now(), data })
    )
    return data
  }
  return _fetchFilterableNetworks()
}

async function _fetchFilerableAssets() {
  const filterableAssets = []
  async function _fetchAssets(cursor) {
    try {
      const { items, pageInfo } = await _fetch({
        args: {
          op: 'assets.list',
        },
        pagination: { limit: 100, cursor },
      })
      filterableAssets.push(...items)
      if (pageInfo?.hasNextPage && filterableAssets.length < MAX_ASSETS) {
        await _fetchAssets(pageInfo.endCursor)
      }
    } catch (error) {
      console.error(error.message)
    }
  }
  await _fetchAssets()
  return filterableAssets
}

export async function fetchFilterableAssets() {
  if (hasLocalStorage()) {
    const cacheKey = 'icTransfersCache_filterable_assets'
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { timestamp, data } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
        return data
      }
    }

    const data = await _fetchFilerableAssets()
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ timestamp: Date.now(), data })
    )
    return data
  }
  return _fetchFilerableAssets()
}

export function subscribeToTransfers(
  filters,
  { onNewTransfer, onOpen = () => {}, onError = () => {} }
) {
  const params = new URLSearchParams(asIcCriteria(filters)).toString()
  const source = new EventSource(`${sseUrl}?${params}`)
  source.onopen = onOpen

  source.addEventListener('new_transfer', (e) =>
    onNewTransfer(JSON.parse(e.data), filters)
  )

  source.onerror = (error) => {
    console.error('[transfers] SSE error:', error)
    onError(error)

    if (source.readyState === EventSource.CLOSED) {
      // TODO: exponential retry
      console.warn('[transfers] SSE connection closed by server.')
    }
  }

  return () => {
    source.close()
  }
}

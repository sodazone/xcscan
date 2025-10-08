import { fetchWithRetry } from '../api.js'
import { httpUrl } from '../env.js'
import { actionsToQueryValues, protocolsToQueryValues } from './common.js'

const sseUrl = `${httpUrl}/sse/crosschain/default`
const queryUrl = `${httpUrl}/query/crosschain`

const CACHE_EXPIRY_MS = 3_600_000
const MAX_ASSETS = 200

let hasStorage = null
function hasLocalStorage() {
  if (hasStorage !== null) {
    return hasStorage
  }

  try {
    const testKey = 'test'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    hasStorage = true
  } catch {
    hasStorage = false
  }

  return hasStorage
}

async function _fetch(args) {
  return await fetchWithRetry(queryUrl, args)
}

function asCriteria(filters) {
  const {
    currentSearchTerm,
    chainPairMode,
    selectedChains,
    selectedDestinations,
    selectedOrigins,
    selectedStatus,
    selectedActions,
    selectedUsdAmounts,
    selectedAssets,
    selectedProtocols,
  } = filters

  const criteria = {}

  // Text search
  if (currentSearchTerm) {
    const trimmed = currentSearchTerm.trim()
    if (trimmed.length > 2 && trimmed.length < 100) {
      // Prefix qualifier
      const prefixMatch = /^([at]):(.+)$/.exec(trimmed)
      if (prefixMatch) {
        const [, prefix, value] = prefixMatch
        if (prefix === 'a') criteria.address = value
        else if (prefix === 't') criteria.txHash = value.toLowerCase()
        // 0x
      } else if (trimmed.startsWith('0x')) {
        const byteLength = (trimmed.length - 2) / 2
        if (byteLength === 20) {
          criteria.address = trimmed.toLowerCase()
        } else if (byteLength === 32) {
          criteria.txHash = trimmed.toLowerCase()
        }
      } else {
        // Fallback: treat as address
        criteria.address = trimmed.toLowerCase()
      }
    }
  }

  // Structured filters
  if (chainPairMode) {
    if (selectedDestinations?.length) {
      criteria.destinations = [...selectedDestinations]
    }
    if (selectedOrigins?.length) {
      criteria.origins = [...selectedOrigins]
    }
  } else if (selectedChains?.length) {
    criteria.networks = [...selectedChains]
  }

  if (selectedStatus?.length) {
    criteria.status = [...selectedStatus]
  }
  if (selectedActions?.length) {
    criteria.actions = [...actionsToQueryValues(selectedActions)]
  }
  if (selectedAssets?.length) {
    criteria.assets = [...selectedAssets]
  }
  if (selectedProtocols?.length) {
    criteria.protocols = [...protocolsToQueryValues(selectedProtocols)]
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
    const cacheKey = 'xcsExplorerCache_filterable_assets'
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

export async function listJourneys({ filters, pagination }) {
  try {
    const criteria = asCriteria(filters)
    return await _fetch({
      args: {
        op: 'journeys.list',
        criteria,
      },
      pagination,
    })
  } catch (error) {
    console.error(error.message)
  }
}

export async function getJourneyById(id) {
  try {
    return await _fetch({
      args: {
        op: 'journeys.by_id',
        criteria: {
          id,
        },
      },
    })
  } catch (error) {
    console.error(error.message)
  }
}

export function subscribeToJourney(
  id,
  { onUpdateJourney, onOpen = () => {}, onError = () => {} }
) {
  const source = new EventSource(`${sseUrl}?id=${id}`)

  source.onopen = onOpen

  source.addEventListener('update_journey', (e) =>
    onUpdateJourney(JSON.parse(e.data))
  )

  source.onerror = (error) => {
    console.error('SSE error:', error)
    onError(error)

    if (source.readyState === EventSource.CLOSED) {
      // TODO: exponential retry
      console.warn('SSE connection closed by server.')
    }
  }

  return () => {
    source.close()
  }
}

export function subscribeToJourneys(
  filters,
  { onUpdateJourney, onNewJourney, onOpen = () => {}, onError = () => {} }
) {
  // do not pass status filters to server
  // we will handle it in onUpdateJourney and onNewJourney
  const _filters = { ...filters, selectedStatus: [] }
  const params = new URLSearchParams(asCriteria(_filters)).toString()
  const source = new EventSource(`${sseUrl}?${params}`)

  source.onopen = onOpen

  source.addEventListener('update_journey', (e) =>
    onUpdateJourney(JSON.parse(e.data), filters)
  )
  source.addEventListener('new_journey', (e) =>
    onNewJourney(JSON.parse(e.data), filters)
  )

  source.onerror = (error) => {
    console.error('SSE error:', error)
    onError(error)

    if (source.readyState === EventSource.CLOSED) {
      // TODO: exponential retry
      console.warn('SSE connection closed by server.')
    }
  }

  return () => {
    source.close()
  }
}

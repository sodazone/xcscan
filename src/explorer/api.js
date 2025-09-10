import { getWithRetry, postWithRetry } from '../api.js'
import { httpUrl } from '../env.js'
import { actionsToQueryValues } from './common.js'

const sseUrl = `${httpUrl}/sse/xcm/default`
const sseNodUrl = `${httpUrl}/sse/nod/xcm/default`
const queryUrl = `${httpUrl}/query/xcm`

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

async function _fetchQuery(args) {
  return await postWithRetry(queryUrl, args)
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
  } = filters

  const criteria = {}

  // Text search
  if (currentSearchTerm != null) {
    const trimmed = currentSearchTerm.trim()
    if (trimmed.length > 2 && trimmed.length < 100) {
      if (trimmed.startsWith('0x')) {
        const len = (trimmed.length - 2) / 2
        if (len === 20) {
          criteria.address = trimmed
        } else if (len === 32) {
          criteria.txHash = trimmed.toLowerCase()
        }
      } else {
        criteria.address = trimmed
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
      const { items, pageInfo } = await _fetchQuery({
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
    return await _fetchQuery({
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
    return await _fetchQuery({
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

async function requestNodToken() {
  const { token } = await getWithRetry(sseNodUrl)
  if (token == null) {
    throw new Error('Failed to get NOD token')
  }
  return token
}

async function buildSseUrl(paramsObj = {}) {
  const nodToken = await requestNodToken()
  const params = new URLSearchParams({
    ...paramsObj,
    nod: nodToken,
  })
  return `${sseUrl}?${params}`
}

function createEventSource(url, { onOpen, onError, eventHandlers = {} }) {
  const source = new EventSource(url)

  if (onOpen) {
    source.onopen = onOpen
  }

  // attach all custom event handlers
  for (const [eventName, handler] of Object.entries(eventHandlers)) {
    source.addEventListener(eventName, (e) => handler(JSON.parse(e.data)))
  }

  source.onerror = (error) => {
    console.error('SSE error:', error)
    onError?.(error)

    if (source.readyState === EventSource.CLOSED) {
      console.warn('SSE connection closed by server.')
    }
  }

  return () => source.close()
}

export async function subscribeToJourney(
  id,
  { onUpdateJourney, onOpen = () => {}, onError = () => {} }
) {
  const url = await buildSseUrl({ id })
  return createEventSource(url, {
    onOpen,
    onError,
    eventHandlers: {
      update_journey: onUpdateJourney,
    },
  })
}

export async function subscribeToJourneys(
  filters,
  { onUpdateJourney, onNewJourney, onOpen = () => {}, onError = () => {} }
) {
  const _filters = { ...filters, selectedStatus: [] }
  const url = await buildSseUrl(asCriteria(_filters))

  return createEventSource(url, {
    onOpen,
    onError,
    eventHandlers: {
      update_journey: (data) => onUpdateJourney(data, filters),
      new_journey: (data) => onNewJourney(data, filters),
    },
  })
}

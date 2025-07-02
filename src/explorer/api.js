import { fetchWithRetry } from '../api.js'
import { httpUrl } from '../env.js'
import { actionsToQueryValues } from './common.js'

const sseUrl = `${httpUrl}/agents/xcm/sse`
const queryUrl = `${httpUrl}/query/xcm`

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
  const params = new URLSearchParams(asCriteria(filters)).toString()
  const source = new EventSource(`${sseUrl}?${params}`)

  source.onopen = onOpen

  source.addEventListener('update_journey', (e) =>
    onUpdateJourney(JSON.parse(e.data))
  )
  source.addEventListener('new_journey', (e) =>
    onNewJourney(JSON.parse(e.data))
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

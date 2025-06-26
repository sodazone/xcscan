import { apiKey, httpUrl } from '../env.js'
import { actionsToQueryValues } from './common.js'

const sseUrl = `${httpUrl}/agents/xcm/sse`
const queryUrl = `${httpUrl}/query/xcm`
const headers = Object.assign(
  {
    'Content-Type': 'application/json',
  },
  apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
)

async function _fetch(args, pagination) {
  const response = await fetch(queryUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      args,
      pagination,
    }),
  })
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`)
  }

  return await response.json()
}

function asCriteria(filters) {
  const {
    currentSearchTerm,
    selectedDestinations,
    selectedOrigins,
    selectedStatus,
    selectedActions,
  } = filters

  const criteria = {}

  if (selectedDestinations && selectedDestinations.length > 0) {
    criteria.destinations = [...selectedDestinations]
  }
  if (selectedOrigins && selectedOrigins.length > 0) {
    criteria.origins = [...selectedOrigins]
  }
  if (selectedStatus && selectedStatus.length > 0) {
    criteria.status = [...selectedStatus]
  }
  if (selectedActions && selectedActions.length > 0) {
    criteria.actions = [...actionsToQueryValues(selectedActions)]
  }

  if (currentSearchTerm != null) {
    const trimed = currentSearchTerm.trim()
    if (currentSearchTerm.length > 2 && currentSearchTerm.length < 100) {
      if (trimed.startsWith('0x')) {
        const len = (trimed.length - 2) / 2
        if (len === 20) {
          criteria.address = trimed
        } else if (len === 32) {
          criteria.txHash = trimed.toLowerCase()
        }
      } else {
        criteria.address = trimed
      }
    }
  }
  return criteria
}

export async function listJourneys({ filters, pagination }) {
  try {
    const criteria = asCriteria(filters)
    return await _fetch(
      {
        op: 'journeys.list',
        criteria,
      },
      {
        ...pagination,
      }
    )
  } catch (error) {
    console.error(error.message)
  }
}

export async function getJourneyById(id) {
  try {
    return await _fetch({
      op: 'journeys.by_id',
      criteria: {
        id,
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

import { resolveNetworkName } from '../../extras'
import { resolveStopRenderer } from './stops'

export function createJourneyLegs(journey) {
  const container = document.createElement('div')
  container.className = 'mt-8 space-y-6'
  container.id = 'journey-legs'

  const title = document.createElement('h2')
  title.textContent = 'Legs'
  container.appendChild(title)

  const isReceived =
    journey.stops[journey.stops.length - 1].to?.status !== undefined

  journey.stops.forEach((stop, index) => {
    if (isReceived && stop.relay?.status === undefined) {
      stop.relay = null
    }

    if (!stop.from && !stop.relay && !stop.to) return

    const leg = createJourneyLeg(stop, index)
    container.appendChild(leg)
  })

  return container
}

export function getElapsedText(start, end) {
  if (start >= end) {
    console.warn('ts discrepancy', start, end)
    return '(+0m 0s)'
  }

  const deltaSec = Math.floor((end - start) / 1000)

  const hours = Math.floor(deltaSec / 3600)
  const minutes = Math.floor((deltaSec % 3600) / 60)
  const seconds = deltaSec % 60

  if (hours > 0) {
    return `(+${hours}h ${minutes}m ${seconds}s)`
  }

  return `(+${minutes}m ${seconds}s)`
}

function createJourneyLeg(stop, index) {
  const renderer = resolveStopRenderer(stop)
  const from = renderer.stopSegment(stop.from)
  const relay = renderer.stopSegment(stop.relay)
  const to = renderer.stopSegment(stop.to)

  const fromName = stop.from?.chainId
    ? resolveNetworkName(stop.from.chainId)
    : null
  const toName = stop.to?.chainId ? resolveNetworkName(stop.to.chainId) : null
  const relayName = stop.relay?.chainId
    ? resolveNetworkName(stop.relay.chainId)
    : null

  const timeStart = stop.from?.timestamp ?? stop.relay?.timestamp
  const timeEnd = stop.to?.timestamp
  let elapsedText = ''

  if (timeStart && timeEnd) {
    elapsedText = getElapsedText(timeStart, timeEnd)
  }

  const container = document.createElement('div')
  container.className = 'journey-leg space-y-3'

  const header = document.createElement('div')
  header.className =
    'text-sm text-white/50 flex flex-col md:flex-row md:items-center space-x-2 font-semibold'

  const labelContainer = document.createElement('div')
  labelContainer.className = 'flex flex-wrap space-x-2 items-center truncate'

  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  arrow.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  arrow.setAttribute('fill', 'none')
  arrow.setAttribute('viewBox', '0 0 24 24')
  arrow.setAttribute('stroke-width', '1.5')
  arrow.setAttribute('stroke', 'currentColor')
  arrow.setAttribute('class', 'size-4 text-white/20')
  arrow.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />`

  const names = [fromName, relayName, toName].filter(Boolean)
  if (names.length) {
    names.forEach((name, i) => {
      const span = document.createElement('span')
      span.textContent = name
      labelContainer.appendChild(span)
      if (i < names.length - 1) {
        labelContainer.appendChild(arrow.cloneNode(true))
      }
    })
  } else {
    labelContainer.textContent = `Leg ${index + 1}`
  }

  header.appendChild(labelContainer)

  if (elapsedText) {
    const elapsed = document.createElement('span')
    elapsed.className = 'font-normal text-white/50 text-xs'
    elapsed.textContent = elapsedText
    header.appendChild(elapsed)
  }

  const stopsContainer = document.createElement('div')
  stopsContainer.className = 'grid grid-cols-1 md:grid-cols-3 gap-3 items-start'

  if (from) stopsContainer.appendChild(from)
  if (relay) stopsContainer.appendChild(relay)
  if (to) stopsContainer.appendChild(to)

  container.appendChild(header)
  container.appendChild(stopsContainer)
  container.appendChild(renderer.stopDetails(stop))

  return container
}

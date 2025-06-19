import { resolveNetworkName } from '../../extras'
import { htmlToElement } from '../../utils.js'
import { getJourneyById, subscribeToJourney } from '../api.js'
import {
  decodeWellKnownAddressHTML,
  formatAction,
  formatNetworkWithIconHTML,
  loadResources,
  shortenAddress,
} from '../common.js'
import {
  getSubscanAddressLink,
  getSubscanBlockLink,
  getSubscanExtrinsicLink,
} from '../links.js'
import { createCopyLinkHTML, installCopyEventListener } from './copy-link.js'
import { createXcmProgramViewer } from './json.js'

function createAnimatedEllipsisSVGHTML() {
  const offsets = [15, 60, 105]
  const delays = [0, 0.2, 0.4]

  const circles = offsets
    .map(
      (cx, i) => `
      <circle cx="${cx}" cy="15" r="10">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" begin="${delays[i]}s" />
      </circle>`
    )
    .join('')

  return `
    <svg viewBox="0 0 120 30" fill="currentColor" class="inline w-5 h-5 text-white/60">
      ${circles}
    </svg>
  `
}

function formatTimestampHTML(ts) {
  const date = new Date(ts)

  const hours = date.getUTCHours()
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  const ampm = hours >= 12 ? 'PM' : 'AM'
  const hr12 = hours % 12 || 12

  const time = `${hr12}:${minutes}:${seconds} ${ampm} UTC`

  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = date.toLocaleString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  })
  const year = date.getUTCFullYear()

  const dateStr = `${day} ${month} ${year}`

  return `
    <div class="flex flex-col text-sm text-white/80 leading-tight">
      <span class="font-medium text-white">${time}</span>
      <span class="text-white/50">${dateStr}</span>
    </div>`
}

function formatStatusIconHTML(status) {
  const cls = status.toLowerCase()
  return `<img class="${cls} size-3" src="/icons/${cls}.svg" alt="${cls}" title="${status}" />`
}

function formatStatusHTML(status) {
  const cls = status.toLowerCase()
  return `<div class="status status-${cls}"><span class="status-bullet"></span><span class="status-label">${cls}</span></div>`
}

function createLegStopMetaHTML({ extrinsic, event, chainId }) {
  const extrinsicHTML = extrinsic?.module
    ? `
    <div class="flex items-center space-x-2">
      <span class="text-white/50 text-xs">Tx Hash</span>
      ${createCopyLinkHTML({ text: extrinsic.hash, display: shortenAddress(extrinsic.hash), url: getSubscanExtrinsicLink(chainId, extrinsic.hash) })}
    </div>
    <div class="flex items-center space-x-2">
      <span class="text-white/50 text-xs">Extrinsic</span>
      <span class="text-xs font-medium text-white/80 truncate">${extrinsic.module}.${extrinsic.method}</span>
    </div>
    `
    : ''

  const eventHTML = event?.module
    ? `
    <div class="flex items-center space-x-2">
      <span class="text-white/50 text-xs">Event</span>
      <span class="text-xs font-medium text-white/80 truncate">${event.module}.${event.name}</span>
    </div>
    `
    : ''

  return `
    <div class="text-sm space-y-2">
      ${extrinsicHTML}
      ${eventHTML}
    </div>
  `
}

function createLegStopHTML(stop) {
  if (stop == null) return null

  const opacityClass = stop.blockNumber ? '' : ' opacity-60'

  const networkHTML = formatNetworkWithIconHTML(stop.chainId)
  const statusIconHTML = stop.status
    ? formatStatusIconHTML(stop.status) || ''
    : ''

  const headerHTML = `
    <div class="flex items-center justify-between text-sm text-white/70">
      ${networkHTML}
      ${statusIconHTML}
    </div>
  `

  const bodyHTML = stop.blockNumber
    ? `<div class="flex space-x-2 font-mono text-sm"><span class="text-white/50">Block</span> ${createCopyLinkHTML(
        {
          text: stop.blockNumber,
          url: getSubscanBlockLink(stop.chainId, stop.blockNumber),
        }
      )}</div>`
    : `
      <div class="flex items-center space-x-2 text-sm text-white/60">
        <span>in transit</span>
        ${createAnimatedEllipsisSVGHTML()}
      </div>
    `

  const timestampHTML = stop.timestamp
    ? `<div class="text-white/40 text-xs">${formatTimestampHTML(stop.timestamp)}</div>`
    : ''

  const metaHTML = createLegStopMetaHTML(stop) || ''

  return `
    <div class="bg-white/5 rounded-xl p-4 space-y-4 h-full ${opacityClass}">
      ${headerHTML}
      ${bodyHTML}
      ${timestampHTML}
      ${metaHTML}
    </div>
  `
}

function createLegStop(stop) {
  if (stop == null) {
    const empty = document.createElement('div')
    empty.classList = 'hidden'
    return empty
  }
  return htmlToElement(createLegStopHTML(stop))
}

function createBreadcrumbs() {
  const breadcrumbs = document.createElement('div')
  breadcrumbs.className =
    'flex space-x-2 text-sm mb-4 items-center text-white/60'
  breadcrumbs.innerHTML = `
	  <a class="group flex space-x-2 items-center" href="/">	
		<div class="rounded-full bg-white/10 p-1 text-black/90 group-hover:bg-white/30">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
			</svg>
		</div>
		<span class="group-hover:text-white">Transactions</span>
	  </a>
    `
  return breadcrumbs
}

function getElapsedText(start, end) {
  const deltaSec = Math.floor((end - start) / 1000)
  const minutes = Math.floor(deltaSec / 60)
  const seconds = deltaSec % 60
  return `(+${minutes}m ${seconds}s)`
}

function getTimeDetails({ sentAt, recvAt }) {
  let timeDetails = ''
  if (sentAt) {
    const sentDate = new Date(sentAt)
    const receivedDate = recvAt ? new Date(recvAt) : null

    const formattedSent = `${sentDate.toISOString().split('T').join(' ').split('.')[0]} UTC`
    let formattedReceived = ''
    let elapsed = ''

    if (receivedDate) {
      formattedReceived = `${receivedDate.toISOString().split('T').join(' ').split('.')[0]} UTC`
      elapsed = getElapsedText(sentAt, recvAt)
    }

    timeDetails = `
      <div class="text-right text-white/50">Sent</div>
      <div>${formattedSent}</div>

      ${
        receivedDate
          ? `
      <div class="text-right text-white/50">Received</div>
      <div>${formattedReceived} <span class="text-white/40">${elapsed}</span></div>
      `
          : ''
      }
    `
  }
  return timeDetails
}

function getAmounts({ assets }) {
  return Array.isArray(assets)
    ? assets
        .map((a) =>
          a.decimals == null
            ? ''
            : `<div>${a.amount / 10 ** a.decimals} ${a.symbol}</div>`
        )
        .join('')
    : ''
}

function createJourneySummary(journey) {
  const amounts = getAmounts(journey)
  const timeDetails = getTimeDetails(journey)
  const fromAddress = journey.from.startsWith('urn')
    ? null
    : shortenAddress(journey.fromFormatted ?? journey.from)
  const toAddress = journey.to.startsWith('urn')
    ? null
    : (decodeWellKnownAddressHTML(journey.to) ??
      shortenAddress(journey.toFormatted ?? journey.to))

  const actionFormatted = formatAction(journey)

  const summary = document.createElement('div')
  summary.className = 'bg-white/5 rounded-xl p-4 space-y-2'

  summary.innerHTML = `
  <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-4 text-sm text-white/80 pt-2">
    <div class="text-right text-white/50">ID</div>
    <div class="truncate" title="${journey.correlationId}">${journey.correlationId}</div>

    <div class="text-right text-white/50">Status</div>
    <div>${formatStatusHTML(journey.status)}</div>

    <div class="text-right text-white/50">Action</div>
    <div class="truncate break-all">${actionFormatted}</div>

    ${timeDetails}

    <div class="text-right text-white/50">From</div>
    <div class="flex flex-col space-y-1">
       ${formatNetworkWithIconHTML(journey.origin)}
       ${
         fromAddress == null
           ? ''
           : `<div class="break-all">${createCopyLinkHTML({
               text: journey.from,
               display: fromAddress,
               url: getSubscanAddressLink(journey.origin, journey.from),
             })}</div>`
       }
    </div>

    <div class="text-right text-white/50">To</div>
        <div class="flex flex-col space-y-1">
       ${formatNetworkWithIconHTML(journey.destination)}
	   ${
       toAddress == null
         ? ''
         : `<div class="break-all">${createCopyLinkHTML({
             text: journey.to,
             display: toAddress,
             url: getSubscanAddressLink(journey.destination, journey.to),
           })}</div>`
     }
    </div>

    ${
      amounts === ''
        ? ''
        : `<div class="text-right text-white/50">Assets</div>
    <div class="flex flex-col space-y-1">${amounts}</div>`
    }
  </div>
`
  return summary
}

function createJourneyLeg(stop, index) {
  const from = createLegStop(stop.from)
  const relay = createLegStop(stop.relay)
  const to = createLegStop(stop.to)

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
  container.className = 'space-y-3'

  const header = document.createElement('div')
  header.className =
    'text-sm text-white/50 flex flex-wrap items-center space-x-2 font-semibold'

  const labelContainer = document.createElement('div')
  labelContainer.className = 'flex space-x-2 items-center truncate'

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
    elapsed.className = 'font-normal text-white/40 text-xs ml-2'
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

  return container
}

function createJourneyLegs(journey) {
  const container = document.createElement('div')
  container.className = 'my-8 space-y-6'

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

async function loadTransactionDetail() {
  try {
    const selectId = window.location.hash.substring(1)
    const { items } = await getJourneyById(selectId)
    const container = document.querySelector('.transaction-detail')

    container.innerHTML = ''

    if (items == null || items.length === 0) {
      const breadcrumbs = createBreadcrumbs()
      container.appendChild(breadcrumbs)
      container.appendChild(
        htmlToElement(`
  <div class="my-8 p-4 mx-auto text-lg text-white/80">
    <p>Sorry, we couldn't find that journey.</p>
    <p class="mt-2">
      Please <a href="/" class="text-blue-400 underline hover:text-blue-600">go back to transactions</a> and try again.
    </p>
  </div>
`)
      )
      return
    }

    const journey = items[0]
    const summary = createJourneySummary(journey)
    const legs = createJourneyLegs(journey)
    const program = createXcmProgramViewer(journey)

    const breadcrumbs = createBreadcrumbs()

    container.appendChild(breadcrumbs)
    container.appendChild(summary)
    container.appendChild(legs)
    container.appendChild(program)

    function onUpdateJourney(journey) {
      // TODO
    }

    subscribeToJourney(journey.correlationId, {
      onUpdateJourney,
    })
  } catch (err) {
    console.error('Error loading transaction:', err)
  }
}

window.onload = async () => {
  installCopyEventListener()

  await loadResources()
  await loadTransactionDetail()
}

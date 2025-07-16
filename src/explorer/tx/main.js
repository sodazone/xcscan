import { resolveAssetIcon, resolveNetworkName } from '../../extras'
import { htmlToElement } from '../../utils.js'
import { getJourneyById, subscribeToJourney } from '../api.js'
import {
  asClassName,
  decodeWellKnownAddressHTML,
  formatAction,
  formatAssetAmount,
  formatLocalTimestamp,
  formatNetworkWithIconHTML,
  getStatusLabel,
  loadResources,
  pad,
  shortenAddress,
} from '../common.js'
import {
  getSubscanAddressLink,
  getSubscanBlockLink,
  getSubscanExtrinsicLink,
} from '../links.js'
import {
  createCopyLinkHTML,
  installCopyEventListener,
} from '../components/copy-link.js'
import { createXcmProgramViewer } from './json.js'

function formatLocalAndUTC(dateInput) {
  const date = new Date(dateInput)

  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const mi = pad(date.getMinutes())
  const ss = pad(date.getSeconds())

  const timeZoneName =
    new Intl.DateTimeFormat(undefined, {
      timeZoneName: 'short',
    })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value || ''

  const local = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss} ${timeZoneName}`

  const utc = date.toISOString().split('T').join(' ').split('.')[0] + ' UTC'

  return `<span title="${utc}">${local}</span>`
}

function formatStatusIconHTML(status) {
  const label = getStatusLabel(status)
  const cls = asClassName(label)
  return `<img class="${cls} size-3" src="/icons/${cls}.svg" alt="${cls}" title="${label}" />`
}

function formatStatusHTML(status) {
  const label = getStatusLabel(status)
  const cls = asClassName(label)
  return `<div class="status status-${cls}"><span class="status-bullet"></span><span class="status-label">${label}</span></div>`
}

function createLegStopMetaHTML({ blockNumber, extrinsic, event, chainId }) {
  const extrinsicHTML = extrinsic?.module
    ? `
    <div class="flex items-center space-x-2">
      <span class="text-white/50 text-xs">Tx Hash</span>
      ${createCopyLinkHTML({ text: extrinsic.hash, display: shortenAddress(extrinsic.hash), url: getSubscanExtrinsicLink(chainId, extrinsic.hash) })}
    </div>
    ${
      extrinsic.evmTxHash
        ? `
      <div class="flex items-center space-x-2">
        <span class="text-white/50 text-xs">EVM Tx Hash</span>
        ${createCopyLinkHTML({ text: extrinsic.evmTxHash, display: shortenAddress(extrinsic.evmTxHash), url: getSubscanExtrinsicLink(chainId, extrinsic.evmTxHash) })}
      </div>
      `
        : ''
    }
    <div class="flex flex-col space-y-1">
      <div class="text-white/50 text-xs">Extrinsic</div>
      <div class="flex flex-col space-y-1">
        <span title="${extrinsic.module}.${extrinsic.method}" class="text-xs font-medium text-white/80 truncate">${extrinsic.module}.${extrinsic.method}</span>
        <span class="text-xs text-white/60">${blockNumber}${extrinsic.blockPosition ? `-${extrinsic.blockPosition}` : ''}</span>
      </div>
    </div>
    `
    : ''

  const eventHTML = event?.module
    ? `
    <div class="flex flex-col space-y-1">
      <div class="text-white/50 text-xs">Event</div>
      <div class="flex flex-col space-y-1">
        <span title="${event.module}.${event.name}" class="text-xs font-medium text-white/80 truncate">${event.module}.${event.name}</span>
        <span class="text-xs text-white/60">${blockNumber}${event.blockPosition ? `-${event.blockPosition}` : ''}</span>
      </div>
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
      </div>
    `

  const timestampHTML = stop.timestamp
    ? formatLocalTimestamp(stop.timestamp)
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

function getElapsedText(start, end) {
  if (start >= end) {
    console.warn('ts discrepancy', start, end)
    return '(+0m 0s)'
  }
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

    const formattedSent = formatLocalAndUTC(sentDate)
    let formattedReceived = ''
    let elapsed = ''

    if (receivedDate) {
      formattedReceived = formatLocalAndUTC(receivedDate)
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

function assetIconHTML({ asset }) {
  const sources = resolveAssetIcon(asset)
  if (sources) {
    const { assetIconUrl, chainIconUrl } = sources
    if (assetIconUrl) {
      return `
      <div class="relative inline-block w-5 h-5">
        <img class="w-full h-full rounded-full object-cover bg-black/20 border-black/40 border" src="${assetIconUrl}" alt="" />
        ${
          chainIconUrl
            ? `<img
              class="absolute top-0 -left-1 w-3 h-3 rounded-full border border-white bg-white"
              src="${chainIconUrl}"
              alt=""
            />`
            : ''
        }
      </div>
    `
    }
  }
  return ''
}

function getAmounts({ assets }) {
  if (!Array.isArray(assets) || assets.length === 0) return ''
  return renderTransferAndSwaps(assets) + renderTrapped(assets)
}

function renderTransferAndSwaps(assets) {
  const transfers = assets.filter((a) => !a.role || a.role === 'transfer')
  const swapsRaw = assets.filter(
    (a) => a.role === 'swap_in' || a.role === 'swap_out'
  )

  // Group by sequence
  const swapPairs = {}
  for (const asset of swapsRaw) {
    const seq = asset.sequence ?? -1
    if (!swapPairs[seq]) swapPairs[seq] = {}
    swapPairs[seq][asset.role] = asset
  }

  const result = []

  for (const transfer of transfers) {
    result.push(
      `<div class="flex items-center gap-2 text-white/80">${assetIconHTML(transfer)}${formatAssetAmount(transfer)}</div>`
    )

    const relatedSwaps = Object.values(swapPairs).filter(
      (pair) => pair.swap_in?.asset === transfer.asset
    )

    for (const { swap_in: from, swap_out: to } of relatedSwaps) {
      if (!from || !to) continue
      result.push(`
        <div class="flex items-center gap-2 text-sm text-white/80 ml-1">
          <span class="text-white/40">
            <svg class="size-4" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 6 H6 V0" stroke="currentColor" stroke-width="1"/>
              </svg>
          </span>
          <div>swap</div>
          <div class="flex items-center gap-1">${assetIconHTML(from)}${formatAssetAmount(from)}</div>
          <span class="text-white/40">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4">
              <path fill-rule="evenodd" d="M2 8c0 .414.336.75.75.75h8.69l-1.22 1.22a.75.75 0 1 0 1.06 1.06l2.5-2.5a.75.75 0 0 0 0-1.06l-2.5-2.5a.75.75 0 1 0-1.06 1.06l1.22 1.22H2.75A.75.75 0 0 0 2 8Z" clip-rule="evenodd" />
            </svg>
          </span>
          <div class="flex items-center gap-1">${assetIconHTML(to)}${formatAssetAmount(to)}</div>
        </div>
      `)
    }
  }

  return result.join('')
}

function renderTrapped(assets) {
  const trapped = assets.filter((a) => a.role === 'trapped')
  if (trapped.length === 0) return ''

  return trapped
    .map(
      (a) =>
        `<div class="flex items-center gap-2 bg-red-500/10 rounded-full py-1 pl-1 pr-2 w-fit text-white/80">
          ${assetIconHTML(a)}
          ${formatAssetAmount(a)}
          <div class="text-red-400/80 font-medium">trapped</div>
        </div>`
    )
    .join('')
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
  summary.id = 'journey-summary'
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
               text: journey.fromFormatted ?? journey.from,
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
             text: journey.toFormatted ?? journey.to,
             display: toAddress,
             url: getSubscanAddressLink(journey.destination, journey.to),
           })}</div>`
     }
    </div>

    ${
      amounts === ''
        ? ''
        : `<div class="text-right text-white/50">Assets</div>
    <div class="flex flex-col space-y-2">${amounts}</div>`
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
    'text-sm text-white/50 flex flex-col md:flex-row md:items-center space-x-2 font-semibold'

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
    elapsed.className = 'font-normal text-white/40 text-xs'
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

async function loadTransactionDetail() {
  try {
    const selectId = window.location.hash.substring(1)
    const { items } = await getJourneyById(selectId)
    const container = document.querySelector('.transaction-detail')

    container.innerHTML = ''

    if (items == null || items.length === 0) {
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

    container.appendChild(summary)
    container.appendChild(legs)
    container.appendChild(program)

    let disconnect

    function onUpdateJourney(updatedJourney) {
      const oldSummary = document.getElementById('journey-summary')
      const oldLegs = document.getElementById('journey-legs')

      if (oldSummary) {
        const newSummary = createJourneySummary(updatedJourney)
        oldSummary.replaceWith(newSummary)
      }
      if (oldLegs) {
        const newLegs = createJourneyLegs(updatedJourney)
        oldLegs.replaceWith(newLegs)
      }

      if (disconnect != null && updatedJourney.status !== 'sent') {
        disconnect()
      }
    }

    if (journey.status === 'sent') {
      disconnect = subscribeToJourney(journey.correlationId, {
        onUpdateJourney,
        onError: console.error,
      })
    }
  } catch (err) {
    console.error('Error loading transaction:', err)
  }
}

window.onload = async () => {
  installCopyEventListener()

  await loadResources()
  await loadTransactionDetail()
}

import { htmlToElement } from '../../utils.js'
import { getJourneyById, subscribeToJourney } from '../api.js'
import {
  asClassName,
  assetIconHTML,
  formatAction,
  formatAssetAmount,
  formatNetworkWithIconHTML,
  getStatusLabel,
  loadResources,
  pad,
} from '../common.js'
import { getExplorerAddressLink } from '../links.js'
import {
  createCopyLinkHTML,
  installCopyEventListener,
} from '../components/copy-link.js'
import { getSafeLocale } from '../../formats.js'
import { createJourneyLegs, getElapsedText } from './legs.js'
import { createCollapsibleJsonViewer } from './json.js'
import { resolveProtocols } from '../../protocols.js'
import { resolveAddress } from '../addresses.js'

function formatLocalAndUTC(dateInput) {
  const date = new Date(dateInput)

  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const mi = pad(date.getMinutes())
  const ss = pad(date.getSeconds())

  const timeZoneName =
    new Intl.DateTimeFormat(getSafeLocale(), {
      timeZoneName: 'short',
    })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value || ''

  const local = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss} ${timeZoneName}`

  const utc = date.toISOString().split('T').join(' ').split('.')[0] + ' UTC'

  return `<span title="${utc}">${local}</span>`
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
      <div class="text-white/50">Sent</div>
      <div>${formattedSent}</div>

      ${
        receivedDate
          ? `
      <div class="text-white/50">Received</div>
      <div>${formattedReceived} <span class="text-white/50">${elapsed}</span></div>
      `
          : ''
      }
    `
  }
  return timeDetails
}

function formatStatusHTML(status) {
  const label = getStatusLabel(status)
  const cls = asClassName(label)
  return `<div class="status status-${cls}"><span class="status-bullet"></span><span class="status-label">${label}</span></div>`
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
      `<div class="flex items-center gap-2 text-white/90">${assetIconHTML(transfer)}${formatAssetAmount(transfer)}</div>`
    )
  }

  for (const { swap_in: from, swap_out: to } of Object.values(swapPairs)) {
    if (!from || !to) continue
    result.push(`
        <div class="flex items-center gap-2 text-sm text-white/90 ml-1">
          <span class="text-white/40">
            <svg class="size-4" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 6 H6 V0" stroke="currentColor" stroke-width="1"/>
              </svg>
          </span>
          <div class="hidden md:inline-block">swap</div>
          <div class="flex items-center gap-1">${assetIconHTML(from)}${formatAssetAmount(from, true, 'flex flex-col md:flex-row md:gap-2 md:items-center')}</div>
          <span class="text-white/40">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4">
              <path fill-rule="evenodd" d="M2 8c0 .414.336.75.75.75h8.69l-1.22 1.22a.75.75 0 1 0 1.06 1.06l2.5-2.5a.75.75 0 0 0 0-1.06l-2.5-2.5a.75.75 0 1 0-1.06 1.06l1.22 1.22H2.75A.75.75 0 0 0 2 8Z" clip-rule="evenodd" />
            </svg>
          </span>
          <div class="flex items-center gap-1">${assetIconHTML(to)}${formatAssetAmount(to, true, 'flex flex-col md:flex-row md:gap-2 md:items-center')}</div>
        </div>
      `)
  }

  return result.join('')
}

function renderTrapped(assets) {
  const trapped = assets.filter((a) => a.role === 'trapped')
  if (trapped.length === 0) return ''

  return trapped
    .map(
      (a) =>
        `<div class="flex items-center gap-2 bg-red-500/10 rounded-full py-1 pl-1 pr-2 w-fit text-white/90">
          ${assetIconHTML(a)}
          ${formatAssetAmount(a)}
          <div class="text-red-400/80 font-medium text-xs">trapped</div>
        </div>`
    )
    .join('')
}

function createJourneySummary(journey) {
  const amounts = getAmounts(journey)
  const timeDetails = getTimeDetails(journey)
  const fromAddress = resolveAddress({
    address: journey.from,
    formatted: journey.fromFormatted,
  })
  const toAddress = resolveAddress({
    address: journey.to,
    formatted: journey.toFormatted,
  })

  const actionFormatted = formatAction(journey)
  const protocols = resolveProtocols([
    journey.originProtocol,
    journey.destinationProtocol,
  ])

  const summary = document.createElement('div')
  summary.id = 'journey-summary'
  summary.className = 'bg-white/5 rounded-xl p-4 space-y-2'

  summary.innerHTML = `
  <div class="flex flex-col md:grid md:grid-cols-[auto_1fr] md:gap-4 text-sm text-white/90 pt-2">
    <div class="text-white/50">ID</div>
    <div class="truncate" title="${journey.correlationId}">${journey.correlationId}</div>

    <div class="text-white/50">Status</div>
    <div>${formatStatusHTML(journey.status)}</div>

    <div class="text-white/50">Protocols</div>
    <div class="flex items-center">${protocols}</div>

    <div class="text-white/50">Action</div>
    <div class="truncate break-all">${actionFormatted}</div>

    ${timeDetails}

    <div class="text-white/50">From</div>
    <div class="flex flex-col space-y-1">
       ${formatNetworkWithIconHTML(journey.origin)}
       ${
         fromAddress == null
           ? ''
           : `<div class="break-all">${createCopyLinkHTML({
               text: journey.fromFormatted ?? journey.from,
               display: fromAddress,
               url: getExplorerAddressLink(
                 journey.origin,
                 journey.from,
                 journey.fromFormatted
               ),
             })}</div>`
       }
    </div>

    <div class="text-white/50">To</div>
        <div class="flex flex-col space-y-1">
       ${formatNetworkWithIconHTML(journey.destination)}
	   ${
       toAddress == null
         ? ''
         : `<div class="break-all">${createCopyLinkHTML({
             text: journey.toFormatted ?? journey.to,
             display: toAddress,
             url: getExplorerAddressLink(
               journey.destination,
               journey.to,
               journey.toFormatted
             ),
           })}</div>`
     }
    </div>

    ${
      amounts === ''
        ? ''
        : `<div class="text-white/50">Assets</div>
    <div class="flex flex-col space-y-2">${amounts}</div>`
    }
  </div>
`
  return summary
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
  <div class="my-8 p-4 mx-auto text-lg text-white/90">
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

    container.appendChild(summary)
    container.appendChild(legs)

    if (
      journey.stops.every((s) => s.instructions == null) &&
      journey.instructions.length > 0
    ) {
      console.log(journey.instructions)
      const program = createCollapsibleJsonViewer(journey.instructions, {
        depth: 2,
        label: 'XCM Program Code',
      })
      container.appendChild(program)
    }

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

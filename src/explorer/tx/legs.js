import { resolveNetworkName } from '../../extras'
import { htmlToElement } from '../../utils'
import {
  asClassName,
  formatLocalTimestamp,
  formatNetworkWithIconHTML,
  getStatusLabel,
  shortenAddress,
} from '../common'
import { createCopyLinkHTML } from '../components/copy-link'
import { getSubscanBlockLink, getSubscanExtrinsicLink } from '../links'
import { createCollapsibleJsonViewer } from './json'

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
  const minutes = Math.floor(deltaSec / 60)
  const seconds = deltaSec % 60
  return `(+${minutes}m ${seconds}s)`
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
  container.appendChild(createXcmDetails(stop))

  return container
}

function createLegStopMetaHTML({ blockNumber, extrinsic, event, chainId }) {
  const extrinsicHTML = extrinsic?.module
    ? `
    <div class="flex items-center space-x-2">
      <span class="text-white/50">Tx Hash</span>
      ${createCopyLinkHTML({ text: extrinsic.hash, display: shortenAddress(extrinsic.hash), url: getSubscanExtrinsicLink(chainId, extrinsic.hash) })}
    </div>
    ${
      extrinsic.evmTxHash
        ? `
      <div class="flex items-center space-x-2">
        <span class="text-white/50">EVM Tx Hash</span>
        ${createCopyLinkHTML({ text: extrinsic.evmTxHash, display: shortenAddress(extrinsic.evmTxHash), url: getSubscanExtrinsicLink(chainId, extrinsic.evmTxHash) })}
      </div>
      `
        : ''
    }
    <div class="flex flex-col space-y-1">
      <div class="text-white/50">Extrinsic</div>
      <div class="flex flex-col space-y-1">
        <span title="${extrinsic.module}.${extrinsic.method}" class="font-medium text-white/90 truncate">${extrinsic.module}.${extrinsic.method}</span>
        <span class="text-white/90">${blockNumber}${asPositionSuffix(extrinsic.blockPosition)}</span>
      </div>
    </div>
    `
    : ''

  const eventHTML = event?.module
    ? `
    <div class="flex flex-col space-y-1">
      <div class="text-white/50">Event</div>
      <div class="flex flex-col space-y-1">
        <span title="${event.module}.${event.name}" class="font-medium truncate">${event.module}.${event.name}</span>
        <span class="text-white/90">${blockNumber}${asPositionSuffix(event.blockPosition)}</span>
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
    <div class="flex items-center justify-between text-sm text-white/90">
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
      <div>
      </div>
    `

  const timestampHTML =
    stop.timestamp != null ? formatLocalTimestamp(stop.timestamp) : ''

  const metaHTML = createLegStopMetaHTML(stop) || ''

  const trappedHTML = formatAssetsTrappedHTML(stop)

  return `
    <div class="bg-white/5 rounded-xl p-4 space-y-4 h-full ${opacityClass}">
      ${headerHTML}
      ${bodyHTML}
      ${timestampHTML}
      ${metaHTML}
      ${trappedHTML}
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

function formatStatusIconHTML(status) {
  const label = getStatusLabel(status)
  const cls = asClassName(label)
  return `<img class="${cls} size-3" src="/icons/${cls}.svg" alt="${cls}" title="${label}" />`
}

function formatAssetsTrappedHTML(stop) {
  if (stop.assetsTrapped) {
    const assetsNum = stop.assetsTrapped.assets?.length ?? 0
    const { event } = stop.assetsTrapped
    const label = `${assetsNum} ${assetsNum > 1 ? 'assets' : 'asset'}`
    const link =
      event.blockNumber == null
        ? ''
        : createCopyLinkHTML({
            text: `${event.blockNumber}${asPositionSuffix(event.eventId)}`,
            url: getSubscanBlockLink(stop.chainId, event.blockNumber),
          })
    return `<div class="flex gap-2 text-sm items-center">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4 text-yellow-500">
      <path fill-rule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 1 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
    </svg>
    <span class="flex space-x-2 items-center"><span>${label} trapped</span>${link}</span>
    <div>`
  }
  return ''
}

function createXcmDetails(stop) {
  const detailsContent = createXcmDetailsContent(stop)
  if (!detailsContent) {
    const empty = document.createElement('div')
    empty.classList = 'hidden'
    return empty
  }

  const wrapper = document.createElement('div')
  wrapper.className = 'dropdown'

  const button = document.createElement('button')
  button.className = 'dropdown-toggle group my-2 items-center'
  button.style = 'padding: 0;'
  button.setAttribute('aria-expanded', 'false')

  // Create the inner flex container for button text
  const innerDiv = document.createElement('div')
  innerDiv.className = 'flex items-start gap-2'

  // Text span
  const btnText = document.createElement('div')
  btnText.innerHTML = `
    <div class="flex space-x-2 items-center group-hover:text-white/60">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
      <span class="text-white/60 group-hover:text-white/80">XCM Details</span>
    </div>`
  innerDiv.appendChild(btnText)

  button.appendChild(innerDiv)

  // Chevron SVG element
  const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  chevron.setAttribute('viewBox', '0 0 24 24')
  chevron.setAttribute('fill', 'none')
  chevron.setAttribute('stroke', 'currentColor')
  chevron.setAttribute('stroke-width', '2')
  chevron.setAttribute('stroke-linecap', 'round')
  chevron.setAttribute('stroke-linejoin', 'round')
  chevron.classList.add('dropdown-chevron')

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M19 9l-7 7-7-7')
  chevron.appendChild(path)

  button.appendChild(chevron)

  button.addEventListener('click', () => {
    const isVisible = detailsContent.classList.toggle('hidden') === false
    button.setAttribute('aria-expanded', isVisible.toString())
    wrapper.classList.toggle('open', isVisible)
  })

  wrapper.appendChild(button)
  wrapper.appendChild(detailsContent)

  return wrapper
}

function createXcmDetailsContent(stop) {
  if (!stop.messageHash && !stop.messageId && !stop.to?.instructions) {
    return null
  }

  const container = document.createElement('div')
  container.className =
    'flex flex-col bg-white/5 rounded-xl p-4 space-y-2 h-full text-sm hidden'

  if (stop.messageHash) {
    const messageHashEl = document.createElement('div')
    messageHashEl.className = 'flex flex-col space-y-1'
    messageHashEl.innerHTML = `<span class="text-white/50">Message Hash</span> <span class="break-all text-white/80 text-mono">${stop.messageHash}</span>`
    container.appendChild(messageHashEl)
  }

  if (stop.messageId && stop.messageId !== stop.messageHash) {
    const messageIdEl = document.createElement('div')
    messageIdEl.className = 'flex flex-col space-y-1'
    messageIdEl.innerHTML = `<span class="text-white/50">Topic ID</span> <span class="break-all text-white/80 text-mono">${stop.messageId}</span>`
    container.appendChild(messageIdEl)
  }

  if (stop.instructions) {
    const xcmViewer = createCollapsibleJsonViewer(stop.instructions, {
      depth: 2,
      label: 'XCM Program Code',
      isOpen: true,
    })
    container.appendChild(xcmViewer)
  }

  return container
}

function asPositionSuffix(pos) {
  return pos != null ? `-${pos}` : ''
}

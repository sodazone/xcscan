import { htmlToElement } from '../../../utils'
import {
  formatLocalTimestamp,
  formatNetworkWithIconHTML,
  formatStatusIconHTML,
  shortenAddress,
} from '../../common'
import { createCopyLinkHTML } from '../../components/copy-link'
import { getSubscanBlockLink, getSubscanExtrinsicLink } from '../../links'
import { createCollapsibleJsonViewer } from '../json'

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
  if (!stop.messageHash && !stop.messageId && !stop.instructions) {
    return null
  }

  const container = document.createElement('div')
  container.className =
    'flex flex-col bg-white/5 rounded-xl p-4 space-y-4 h-full text-sm hidden'

  const executeLocationEl = document.createElement('div')
  const networkHTML = formatNetworkWithIconHTML(stop.to.chainId)
  const eventHTML = createEventMetaHTML({
    event: stop.to.event,
    blockNumber: stop.to.blockNumber,
  })

  const topicIdHTML =
    stop.messageId && stop.messageId !== stop.messageHash
      ? `
    <div class="flex flex-col space-y-1">
      <span class="text-white/50">Topic ID</span>
      <span class="break-all text-white/80 text-mono">${stop.messageId}</span>
    </div>`
      : ''

  const messageHashHTML = `
    <div class="flex flex-col space-y-1">
      <span class="text-white/50">Message Hash</span>
      <span class="break-all text-white/80 text-mono">${stop.messageHash}</span>
    </div>
  `

  executeLocationEl.className = 'flex flex-col space-y-4'
  executeLocationEl.innerHTML = `
    ${networkHTML}
    ${eventHTML}
    ${topicIdHTML}
    ${messageHashHTML}
  `

  container.appendChild(executeLocationEl)

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

  const eventHTML = createEventMetaHTML({ event, blockNumber })

  return `
    <div class="text-sm space-y-2">
      ${extrinsicHTML}
      ${eventHTML}
    </div>
  `
}

function createEventMetaHTML({ event, blockNumber }) {
  return event?.module
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
}

export const xcmRenderer = {
  stopSegment: function createLegStop(stop) {
    if (stop == null) {
      const empty = document.createElement('div')
      empty.classList = 'hidden'
      return empty
    }
    return htmlToElement(createLegStopHTML(stop))
  },
  stopDetails: createXcmDetails,
}

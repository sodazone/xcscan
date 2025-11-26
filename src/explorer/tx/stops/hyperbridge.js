import { htmlToElement } from '../../../utils'
import {
  formatLocalTimestamp,
  formatNetworkWithIconHTML,
  formatStatusIconHTML,
  shortHash,
} from '../../common'
import { createCopyLinkHTML } from '../../components/copy-link'
import { getExplorerBlockLink, getExplorerTxLink } from '../../links'
import { createCollapsibleJsonViewer } from '../json'
import { asPositionSuffix, createStopDetails } from './common'

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
          url: getExplorerBlockLink(stop.chainId, stop.blockNumber),
        }
      )}</div>`
    : `
      <div>
      </div>
    `

  const timestampHTML =
    stop.timestamp != null ? formatLocalTimestamp(stop.timestamp) : ''

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

function createLegStopMetaHTML({ blockNumber, tx = {}, event, chainId }) {
  const hasModule = tx.module && tx.method
  const hasTxHash = tx.hash || tx.hashSecondary

  const txHashHTML = hasTxHash
    ? `
      ${
        tx.hash
          ? `
        <div class="flex items-center space-x-2">
          <span class="text-white/50">Tx Hash</span>
          ${createCopyLinkHTML({
            text: tx.hash,
            display: shortHash(tx.hash),
            url: getExplorerTxLink(chainId, {
              hash: tx.hash,
              blockNumber,
              extrinsicIndex: tx.blockPosition,
            }),
          })}
        </div>
      `
          : ''
      }
      ${
        tx.hashSecondary
          ? `
        <div class="flex items-center space-x-2">
          <span class="text-white/50">EVM Tx Hash</span>
          ${createCopyLinkHTML({
            text: tx.hashSecondary,
            display: shortHash(tx.hashSecondary),
            url: getExplorerTxLink(chainId, { hash: tx.hashSecondary }),
          })}
        </div>
      `
          : ''
      }
    `
    : ''

  const extrinsicInfoHTML = hasModule
    ? `
      <div class="flex flex-col space-y-1">
        <div class="text-white/50">Extrinsic</div>
        <div class="flex flex-col space-y-1">
          <span title="${tx.module}.${tx.method}" class="font-medium text-white/90 truncate">${tx.module}.${tx.method}</span>
          <span class="text-white/90">${blockNumber}${asPositionSuffix(tx.blockPosition)}</span>
        </div>
      </div>
    `
    : ''

  const eventHTML = createEventMetaHTML({ event, blockNumber })

  return `
    <div class="text-sm space-y-2">
      ${txHashHTML}
      ${extrinsicInfoHTML}
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

function createIsmpDetailsContent(stop) {
  if (!stop.messageId && !stop.instructions) {
    return null
  }

  const container = document.createElement('div')
  container.className =
    'flex flex-col bg-white/5 rounded-xl p-4 space-y-4 h-full text-sm hidden'

  const executeLocationEl = document.createElement('div')

  const commitmentIdHTML = stop.messageId
    ? `
    <div class="flex flex-col space-y-1">
      <span class="text-white/50">Commitment Hash</span>
      <span class="break-all text-white/80 text-mono">${stop.messageId}</span>
    </div>`
    : ''

  const relayerHTML = stop.relayer
    ? `
    <div class="flex flex-col space-y-1">
      <span class="text-white/50">Relayer</span>
      <span class="break-all text-white/80 text-mono">${stop.relayer}</span>
    </div>`
    : ''

  executeLocationEl.className = 'flex flex-col space-y-4'
  executeLocationEl.innerHTML = `
    ${commitmentIdHTML}
    ${relayerHTML}
  `

  container.appendChild(executeLocationEl)

  if (stop.instructions) {
    const requestViewer = createCollapsibleJsonViewer(stop.instructions, {
      depth: 2,
      label: 'ISMP POST Request',
      isOpen: true,
    })
    container.appendChild(requestViewer)
  }

  return container
}

export const hyperbridgeRenderer = {
  stopSegment: function createLegStop(stop) {
    if (stop == null) {
      const empty = document.createElement('div')
      empty.classList = 'hidden'
      return empty
    }
    return htmlToElement(createLegStopHTML(stop))
  },
  stopDetails: function createDetails(stop) {
    return createStopDetails('ISMP Details', createIsmpDetailsContent(stop))
  },
}

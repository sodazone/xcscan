import { htmlToElement } from '../../../utils'
import { resolveAddress } from '../../addresses'
import {
  formatLocalTimestamp,
  formatNetworkWithIconHTML,
  formatStatusIconHTML,
  shortHash,
} from '../../common'
import { createCopyLinkHTML } from '../../components/copy-link'
import {
  getExplorerAddressLink,
  getExplorerBlockLink,
  getExplorerTxLink,
} from '../../links'
import { createCollapsibleJsonViewer } from '../json'
import { asPositionSuffix, createStopDetails } from './common'

function createLegStopHTML(stop) {
  if (!stop) return null

  const isTimeout = Boolean(stop.timeout)
  const context = isTimeout ? stop.timeout : stop // unified object
  const opacityClass = context.blockNumber && !isTimeout ? '' : ' opacity-60'

  const blockHTML = context.blockNumber
    ? `<div class="flex space-x-2 font-mono text-sm">
         <span class="text-white/50">Block</span>
         ${createCopyLinkHTML({
           text: context.blockNumber,
           url: getExplorerBlockLink(context.chainId, context.blockNumber),
         })}
       </div>`
    : `<div></div>`

  const timestampHTML =
    context.timestamp != null ? formatLocalTimestamp(context.timestamp) : ''

  const metaHTML = createLegStopMetaHTML(context) || ''

  const statusIconHTML = stop.timeout
    ? formatStatusIconHTML('timeout')
    : (context.status && formatStatusIconHTML(context.status)) || ''

  const headerHTML = `
    <div class="flex items-center justify-between text-sm text-white/90">
      ${formatNetworkWithIconHTML(stop.chainId)}
      ${statusIconHTML}
    </div>
  `

  const timeoutExtraHTML = isTimeout
    ? `
      <div class="flex space-x-2 items-center text-sm text-white/90">
        <span>Timeout on</span>
        ${formatNetworkWithIconHTML(context.chainId)}
      </div>
    `
    : ''

  return `
    <div class="bg-white/5 rounded-xl p-4 space-y-4 h-full ${opacityClass}">
      ${headerHTML}
      ${timeoutExtraHTML}
      ${blockHTML}
      ${timestampHTML}
      ${metaHTML}
    </div>
  `
}

function createTxHashHTML(chainId, blockNumber, tx) {
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

  return txHashHTML
}

function createLegStopMetaHTML({
  blockNumber,
  tx = {},
  event,
  chainId,
  relayer,
  timeout,
}) {
  const hasModule = tx.module && tx.method

  const txHashHTML = createTxHashHTML(chainId, blockNumber, tx)

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

  const relayerAddress = relayer
    ? resolveAddress({
        address: relayer.key,
        formatted: relayer.formatted,
      })
    : null
  const relayerHTML = relayerAddress
    ? `
    <div class="flex flex-col space-y-1">
      <div class="text-white/50">Relayer</div>
      ${createCopyLinkHTML({
        text: relayerAddress,
        display: relayerAddress,
        url: getExplorerAddressLink(chainId, relayer.formatted ?? relayer.key),
      })}
    </div>
  `
    : ''

  return `
    <div class="text-sm space-y-2">
      ${txHashHTML}
      ${extrinsicInfoHTML}
      ${eventHTML}
      ${relayerHTML}
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
        ${blockNumber && event.blockPosition ? `<span class="text-white/90">${blockNumber}${asPositionSuffix(event.blockPosition)}</span>` : ''}
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

  const nonceHTML = stop.nonce
    ? `
    <div class="flex flex-col space-y-1">
      <span class="text-white/50">Nonce</span>
      <span class="break-all text-white/80 text-mono">${stop.nonce}</span>
    </div>`
    : ''

  const payloadHTML = stop.payload
    ? `
    <div class="flex flex-col space-y-1">
      <span class="text-white/50">Payload</span>
      <span class="break-all text-white/80 text-mono">${stop.payload}</span>
    </div>`
    : ''

  executeLocationEl.className = 'flex flex-col space-y-4'
  executeLocationEl.innerHTML = `
    ${commitmentIdHTML}
    ${nonceHTML}
    ${payloadHTML}
  `

  container.appendChild(executeLocationEl)

  if (stop.instructions && Object.keys(stop.instructions).length > 0) {
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

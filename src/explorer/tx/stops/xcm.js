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
import { createStopDetails } from './common'

const bridgeIcons = {
  'pk-bridge': {
    name: 'Polkadot-Kusama Bridge',
    icon: ({ size = 5, color = '#000000' } = {}) => `
      <svg class="size-${size} align-middle" viewBox="0 0 10.054 10.054" xmlns="http://www.w3.org/2000/svg" style="color:${color};">
        <g transform="matrix(1.1805 0 0 1.1805 -1.0598 -2.1088)" stroke-width=".26458" fill="currentColor" fill-opacity="0.5">
          <path d="m5.6853 3.6381h1.0583c0.89916 0 1.5875 0.68834 1.5875 1.5875s-0.68834 1.5875-1.5875 1.5875h-1.0583v1.0583h1.0583c1.4821 0 2.6458-1.1637 2.6458-2.6458s-1.1637-2.6458-2.6458-2.6458h-1.0583"/>
          <path d="m4.6269 6.8131h-1.0583c-0.89916 0-1.5875-0.68834-1.5875-1.5875s0.68834-1.5875 1.5875-1.5875h1.0583v-1.0583h-1.0583c-1.4821 0-2.6458 1.1637-2.6458 2.6458s1.1637 2.6458 2.6458 2.6458h1.0583"/>
          <path d="m6.7436 5.7547v-1.0583h-3.175v1.0583z"/>
        </g>
      </svg>
    `,
  },
  snowbridge: {
    name: 'Snowbridge',
    icon: ({ size = 5, color = '#FFFFFF' } = {}) => `
        <svg class="size-${size} align-middle" viewBox="0 0 10.054 10.054" xmlns="http://www.w3.org/2000/svg" style="color:${color};">
          <g transform="matrix(1.1805 0 0 1.1805 -1.0598 -2.1088)" stroke-width=".26458" fill="currentColor" fill-opacity="0.5">
            <path d="m5.6853 3.6381h1.0583c0.89916 0 1.5875 0.68834 1.5875 1.5875s-0.68834 1.5875-1.5875 1.5875h-1.0583v1.0583h1.0583c1.4821 0 2.6458-1.1637 2.6458-2.6458s-1.1637-2.6458-2.6458-2.6458h-1.0583"/>
            <path d="m4.6269 6.8131h-1.0583c-0.89916 0-1.5875-0.68834-1.5875-1.5875s0.68834-1.5875 1.5875-1.5875h1.0583v-1.0583h-1.0583c-1.4821 0-2.6458 1.1637-2.6458 2.6458s1.1637 2.6458 2.6458 2.6458h1.0583"/>
            <path d="m6.7436 5.7547v-1.0583h-3.175v1.0583z"/>
          </g>
        </svg>
      `,
  },
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
            url: getExplorerBlockLink(stop.chainId, event.blockNumber),
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

function createBridgeDetailsContent(stop) {
  if (!stop.from?.bridge && !stop.to?.bridge) {
    return null
  }

  const container = document.createElement('div')
  container.className =
    'flex flex-col bg-white/5 rounded-xl p-4 space-y-4 h-full text-sm hidden'

  const executeLocationEl = document.createElement('div')

  const bridgeName =
    stop.from?.bridge?.bridgeName ?? stop.to?.bridge?.bridgeName
  const bicon = bridgeIcons[bridgeName]
  const bridgeNameHTML = `
    <div class="flex items-center gap-2 text-white/80">
      ${bicon ? bicon.icon() : ''}
      <div>${bicon ? bicon.name : bridgeName}</div>
    </div>
  `

  const channelIdHTML = `
    <div class="flex flex-col space-y-1">
      <span class="text-white/50">${bridgeName === 'pk-bridge' ? 'Lane ID' : 'Channel ID'}</span>
      <span class="break-all text-white/80 text-mono">${stop.from?.bridge?.channelId ?? stop.to?.bridge?.channelId ?? '-'}</span>
    </div>
  `

  const nonceHTML = `
    <div class="flex flex-col space-y-1">
      <span class="text-white/50">Nonce</span>
      <span class="break-all text-white/80 text-mono">${stop.from?.bridge?.nonce}</span>
    </div>
  `

  executeLocationEl.className = 'flex flex-col space-y-4'
  executeLocationEl.innerHTML = `
    ${bridgeNameHTML}
    ${channelIdHTML}
    ${nonceHTML}
  `

  container.appendChild(executeLocationEl)
  return container
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
  console.log(stop.instructions)
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

function createLegStopMetaHTML({
  blockNumber,
  extrinsic = {},
  event,
  chainId,
}) {
  const hasModule = extrinsic.module && extrinsic.method
  const hasTxHash = extrinsic.hash || extrinsic.evmTxHash

  const txHashHTML = hasTxHash
    ? `
      ${
        extrinsic.hash
          ? `
        <div class="flex items-center space-x-2">
          <span class="text-white/50">Tx Hash</span>
          ${createCopyLinkHTML({
            text: extrinsic.hash,
            display: shortHash(extrinsic.hash),
            url: getExplorerTxLink(chainId, extrinsic.hash),
          })}
        </div>
      `
          : ''
      }
      ${
        extrinsic.evmTxHash
          ? `
        <div class="flex items-center space-x-2">
          <span class="text-white/50">EVM Tx Hash</span>
          ${createCopyLinkHTML({
            text: extrinsic.evmTxHash,
            display: shortHash(extrinsic.evmTxHash),
            url: getExplorerTxLink(chainId, extrinsic.evmTxHash),
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
          <span title="${extrinsic.module}.${extrinsic.method}" class="font-medium text-white/90 truncate">${extrinsic.module}.${extrinsic.method}</span>
          <span class="text-white/90">${blockNumber}${asPositionSuffix(extrinsic.blockPosition)}</span>
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

export const xcmRenderer = {
  stopSegment: function createLegStop(stop) {
    if (stop == null) {
      const empty = document.createElement('div')
      empty.classList = 'hidden'
      return empty
    }
    return htmlToElement(createLegStopHTML(stop))
  },
  stopDetails: function createDetails(stop) {
    // if stop.type === 'bridge, createBridgeDetails
    if (stop.type === 'bridge') {
      return createStopDetails(
        'Bridge Details',
        createBridgeDetailsContent(stop)
      )
    }
    return createStopDetails('XCM Details', createXcmDetailsContent(stop))
  },
}

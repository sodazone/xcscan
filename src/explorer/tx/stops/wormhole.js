import { htmlToElement } from '../../../utils'
import {
  formatLocalTimestamp,
  formatNetworkWithIconHTML,
  formatStatusIconHTML,
  shortHash,
} from '../../common'
import { createCopyLinkHTML } from '../../components/copy-link'
import { getExplorerTxLink } from '../../links'
import { createCollapsibleJsonViewer } from '../json'
import { createStopDetails } from './common'

function createVaaDetailsContent(stop) {
  if (!stop.messageId && !stop.instructions) {
    return null
  }

  const container = document.createElement('div')
  container.className =
    'flex flex-col bg-white/5 rounded-xl p-4 space-y-4 h-full text-sm hidden'

  const executeLocationEl = document.createElement('div')
  const networkHTML = formatNetworkWithIconHTML(stop.to.chainId)

  const messageIdHTML = stop.messageId
    ? `
    <div class="flex flex-col space-y-1">
      <span class="text-white/50">Wormhole ID</span>
      <span class="break-all text-white/80 text-mono">${stop.messageId}</span>
    </div>`
    : ''

  executeLocationEl.className = 'flex flex-col space-y-4'
  executeLocationEl.innerHTML = `
    ${networkHTML}
    ${messageIdHTML}
  `

  container.appendChild(executeLocationEl)

  if (stop.instructions) {
    const viewer = createCollapsibleJsonViewer(stop.instructions, {
      depth: 2,
      label: 'Instructions',
      isOpen: true,
    })
    container.appendChild(viewer)
  }

  return container
}

function createLegStopHTML(stop) {
  if (stop == null) return null

  const isVaa = stop.chainId === 'urn:ocn:wormhole:1'
  const opacityClass = stop.tx || isVaa ? '' : ' opacity-60'

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

  const bodyHTML = stop.tx?.txHash
    ? `<div class="flex space-x-2 font-mono text-sm"><span class="text-white/50">Transaction</span> ${createCopyLinkHTML(
        {
          text: stop.tx.txHash,
          display: shortHash(stop.tx.txHash),
          url: getExplorerTxLink(stop.chainId, stop.tx.txHash, 'etherscan'),
        }
      )}</div>`
    : isVaa
      ? `<div class="flex space-x-2 font-mono text-sm"><span class="text-white/50">VAA ID</span> ${createCopyLinkHTML(
          {
            text: stop.vaaId,
            url: `https://wormholescan.io/#/tx/${stop.vaaId}`,
          }
        )}</div>
    `
      : `
      <div>
      </div>
    `

  const timestampHTML =
    stop.timestamp != null ? formatLocalTimestamp(stop.timestamp) : ''

  return `
    <div class="bg-white/5 rounded-xl p-4 space-y-4 h-full ${opacityClass}">
      ${headerHTML}
      ${bodyHTML}
      ${timestampHTML}
    </div>
  `
}

export const wormholeRenderer = {
  stopSegment: function createLegStop(stop) {
    if (stop == null) {
      const empty = document.createElement('div')
      empty.classList = 'hidden'
      return empty
    }
    return htmlToElement(createLegStopHTML(stop))
  },
  stopDetails: function createDetails(stop) {
    return createStopDetails('VAA Details', createVaaDetailsContent(stop))
  },
}

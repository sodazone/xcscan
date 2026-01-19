import { resolveProtocol } from '../../../protocols'
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

function extractXcmProgram(instruction) {
  if (instruction === null || instruction === undefined) {
    return null
  }
  if (
    'program' in instruction &&
    instruction.program !== null &&
    instruction.program !== undefined &&
    'type' in instruction.program &&
    'value' in instruction.program
  ) {
    return instruction.program
  }
  if ('type' in instruction && 'value' in instruction) {
    return instruction
  }
  return null
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

function normaliseBridgeName(name) {
  if (name === 'pkbridge' || name === 'pk-bridge') {
    return 'pkbridge'
  }
  return name
}

function createBridgeDetailsContent(stop) {
  if (!stop.from?.bridge && !stop.to?.bridge) {
    return null
  }

  const container = document.createElement('div')
  container.className =
    'flex flex-col bg-white/5 rounded-xl p-4 space-y-4 h-full text-sm hidden'

  const executeLocationEl = document.createElement('div')
  executeLocationEl.className = 'flex flex-col space-y-4'

  const bridgeName = normaliseBridgeName(
    stop.from?.bridge?.bridgeName ?? stop.to?.bridge?.bridgeName
  )
  const bridgeNameHTML = `<div class="text-white/80">${resolveProtocol(bridgeName)}</div>`

  const channelIdHTML =
    stop.from?.bridge?.channelId || stop.to?.bridge?.channelId
      ? `
      <div class="flex flex-col space-y-1">
        <span class="text-white/50">${bridgeName === 'pkbridge' ? 'Lane ID' : 'Channel ID'}</span>
        <span class="break-all text-white/80 text-mono">${stop.from?.bridge?.channelId ?? stop.to?.bridge?.channelId}</span>
      </div>
    `
      : ''

  const nonceHTML =
    stop.from?.bridge?.nonce || stop.to?.bridge?.nonce
      ? `
    <div class="flex flex-col space-y-1">
      <span class="text-white/50">Nonce</span>
      <span class="break-all text-white/80 text-mono">${stop.from?.bridge?.nonce ?? stop.to?.bridge?.nonce}</span>
    </div>
  `
      : ''

  executeLocationEl.innerHTML = `
    ${bridgeNameHTML}
    ${channelIdHTML}
    ${nonceHTML}
  `

  container.appendChild(executeLocationEl)

  const instructions = normaliseInstructions(stop.instructions)
  if (instructions.length > 0) {
    instructions.forEach((instruction, index) => {
      const section = document.createElement('div')
      section.className = 'flex flex-col space-y-4'

      const messageId = instruction.messageId ?? stop.messageId
      const topicIdHTML = messageId
        ? `
          <div class="flex flex-col space-y-1">
            <span class="text-white/50">Topic ID</span>
            <span class="break-all text-white/80 text-mono">${messageId}</span>
          </div>
        `
        : ''

      section.innerHTML = `
        ${index > 0 ? '<hr class="border-white/10" />' : ''}
        ${topicIdHTML}
      `

      container.appendChild(section)

      const program = extractXcmProgram(instruction)
      if (program) {
        const xcmViewer = createCollapsibleJsonViewer(program, {
          depth: 2,
          label: `XCM Program${instructions.length > 1 ? ` #${index + 1}` : ''}`,
          isOpen: index === 0,
        })
        container.appendChild(xcmViewer)
      }
    })
  }

  return container
}

function createXcmDetailsContent(stop) {
  const instructions = normaliseInstructions(stop.instructions)
  if (instructions.length === 0) return null

  const container = document.createElement('div')
  container.className =
    'flex flex-col bg-white/5 rounded-xl p-4 space-y-4 h-full text-sm hidden'

  instructions.forEach((instruction, index) => {
    const section = document.createElement('div')
    section.className = 'flex flex-col space-y-4'

    const messageId = instruction.messageId ?? stop.messageId
    const messageHash = instruction.messageHash ?? stop.messageHash

    const executedAt =
      'executedAt' in instruction ? instruction.executedAt : null

    const chainId = stop.to?.chainId ?? stop.from?.chainId

    // Instruction header (only when multiple)
    const instructionHeader =
      instructions.length > 1
        ? `<div class="text-white font-semibold">
             Instruction #${index + 1}
           </div>`
        : ''

    const messageHashHTML = messageHash
      ? `<div class="flex flex-col space-y-1">
           <span class="text-white/50">Message Hash</span>
           <span class="break-all text-white/80 text-mono">${messageHash}</span>
         </div>`
      : ''

    const topicIdHTML =
      messageId && messageId !== messageHash
        ? `<div class="flex flex-col space-y-1">
             <span class="text-white/50">Topic ID</span>
             <span class="break-all text-white/80 text-mono">${messageId}</span>
           </div>`
        : ''

    const executedAtHTML = executedAt
      ? `<div class="flex flex-col space-y-2">
           <div class="text-white/50 flex space-x-2 items-center">
             <span>Executed</span>
             ${formatStatusIconHTML(executedAt.outcome)}
           </div>
           <div class="space-y-1 text-white/80">
             ${formatNetworkWithIconHTML(chainId)}
             ${createEventMetaHTML(
               {
                 event: executedAt.event,
                 blockNumber: stop.to.blockNumber,
               },
               false
             )}
           </div>
         </div>`
      : ''

    section.innerHTML = `
      ${index > 0 ? '<hr class="border-white/10" />' : ''}
      ${instructionHeader}
      ${messageHashHTML}
      ${topicIdHTML}
      ${executedAtHTML}
    `

    container.appendChild(section)

    const program = extractXcmProgram(instruction)
    if (program) {
      const xcmViewer = createCollapsibleJsonViewer(program, {
        depth: 2,
        label: 'XCM Program',
        isOpen: true,
      })
      container.appendChild(xcmViewer)
    }
  })

  return container
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
            url: getExplorerTxLink(chainId, {
              hash: extrinsic.hash,
              blockNumber,
              extrinsicIndex: extrinsic.blockPosition,
            }),
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
            url: getExplorerTxLink(chainId, { hash: extrinsic.evmTxHash }),
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

function createEventMetaHTML({ event, blockNumber }, showHeader = true) {
  return event?.module
    ? `
    <div class="flex flex-col space-y-1">
      ${showHeader ? `<div class="text-white/50">Event</div>` : ''}
      <div class="flex flex-col space-y-1">
        <span title="${event.module}.${event.name}" class="font-medium truncate">${event.module}.${event.name}</span>
        <span class="text-white/90">${blockNumber}${asPositionSuffix(event.blockPosition)}</span>
      </div>
    </div>
    `
    : ''
}

function normaliseInstructions(instructions) {
  if (!instructions) return []
  return Array.isArray(instructions) ? instructions : [instructions]
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

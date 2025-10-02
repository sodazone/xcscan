import { htmlToElement } from '../../../utils'
import {
  formatLocalTimestamp,
  formatNetworkWithIconHTML,
  formatStatusIconHTML,
} from '../../common'
import { createCopyLinkHTML } from '../../components/copy-link'
import { createCollapsibleJsonViewer } from '../json'

function createVaaDetailsContent(stop) {
  if (!stop.messageId && !stop.instructions) {
    return null
  }

  const container = document.createElement('div')
  container.className =
    'flex flex-col bg-white/5 rounded-xl p-4 space-y-4 h-full text-sm hidden'

  const executeLocationEl = document.createElement('div')
  const networkHTML = formatNetworkWithIconHTML(stop.to.chainId)

  const messageIdHTML =
    stop.messageId && stop.messageId !== stop.messageHash
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

function createVaaDetails(stop) {
  const detailsContent = createVaaDetailsContent(stop)
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
      <span class="text-white/60 group-hover:text-white/80">VAA Details</span>
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

function createLegStopHTML(stop) {
  if (stop == null) return null

  const opacityClass = stop.tx ? '' : ' opacity-60'

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

  const bodyHTML = stop.tx
    ? `<div class="flex space-x-2 font-mono text-sm"><span class="text-white/50">Transaction</span> ${createCopyLinkHTML(
        {
          text: stop.tx.txHash,
          url: 'xxx',
        }
      )}</div>`
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
  stopDetails: createVaaDetails,
}

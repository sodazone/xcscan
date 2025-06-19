import { debounce } from '../utils.js'
import { listJourneys } from './api.js'
import {
  decodeWellKnownAddress,
  formatAssetAmount,
  formatNetworkWithIcon,
  loadResources,
  prettify,
  shortenAddress,
} from './common.js'
import { loadSearch } from './search.js'

const pageCursors = [null]
let currentPage = 0
const pageSize = 10

const filters = {
  currentSearchTerm: '',
  selectedDestinations: [],
  selectedOrigins: [],
  selectedStatus: [],
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp)

  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mi = String(date.getUTCMinutes()).padStart(2, '0')
  const ss = String(date.getUTCSeconds()).padStart(2, '0')

  return `
    <div class="flex flex-col space-y-1 leading-tight text-sm">
      <span class="text-white">${hh}:${mi}:${ss} UTC</span>
      <span class="text-white/60">${yyyy}-${mm}-${dd}</span>
    </div>
  `
}

function renderPaginationFooter({ hasNextPage, endCursor }) {
  const paginationFooter = document.querySelector('#pagination-footer')

  if (!paginationFooter) return

  const prevButton = paginationFooter.querySelector('#prev-button')
  const nextButton = paginationFooter.querySelector('#next-button')
  const pageIndicator = paginationFooter.querySelector('#page-indicator')

  pageCursors.push(endCursor)

  prevButton.disabled = currentPage === 0
  nextButton.disabled = !hasNextPage
  pageIndicator.textContent = `Page ${currentPage + 1}`

  prevButton.onclick = () => {
    if (currentPage > 0) {
      currentPage--
      renderCurrentPage(pageCursors[currentPage])
    }
  }

  nextButton.onclick = () => {
    if (hasNextPage) {
      currentPage++
      renderCurrentPage(pageCursors[currentPage])
    }
  }
}

function renderCurrentPage(cursor) {
  listJourneys({
    filters,
    pagination: {
      limit: pageSize,
      cursor,
    },
  })
    .then((results) => {
      renderTransactionsTable(results)
    })
    .catch(console.log)
}

function renderTransactionsTable({ items, pageInfo }) {
  const container = document.querySelector(
    '.transaction-table .transaction-table-body'
  )
  container.innerHTML = ''

  if (items.length === 0) {
    container.innerHTML = `
            <div class="text-center text-white/50 py-10 text-sm opacity-0 transition-opacity duration-500" id="no-results">
                No results found.
            </div>`
    requestAnimationFrame(() => {
      document.querySelector('#no-results')?.classList.add('opacity-100')
    })
    return
  }

  for (const item of items) {
    const fromChain = item.origin
    const toChain = item.destination
    const fromAddress = item.from.startsWith('urn')
      ? null
      : shortenAddress(item.fromFormatted ?? item.from)
    const toAddress = item.to.startsWith('urn')
      ? null
      : (decodeWellKnownAddress(item.to) ??
        shortenAddress(item.toFormatted ?? item.to))
    const time = formatTimestamp(item.sentAt)

    const action = {
      type: item.type,
    }
    if (item.type === 'transact' && item.transactCalls?.length) {
      const call = item.transactCalls[0]
      action.module = call.module
      action.method = prettify(call.method)
    }

    const row = document.createElement('a')
    row.href = `/tx/index.html#${item.correlationId}`
    row.tabIndex = 0
    row.className = 'transaction-row'

    row.innerHTML = `
            <div class="cell flex md:items-center" data-label="Time">
             ${time}
            </div>
<div class="cell flex md:items-center" data-label="Action">
  ${
    action.module !== undefined
      ? `
    <div class="flex flex-col space-y-0.5 text-sm text-white leading-tight tracking-wide break-words">
      <span class="text-white truncate">${action.module}</span>
      <span class="text-xs text-white/70 font-medium truncate">${action.method}</span>
    </div>
    `
      : `<div class="text-sm text-white tracking-wide capitalize">
    ${action.type}
  </div>`
  }
</div>
        <div class="cell flex md:items-center" data-label="From">
          <div class="flex flex-col space-y-1">
            ${formatNetworkWithIcon(fromChain)}
            ${fromAddress == null ? '' : `<div>${fromAddress}</div>`}
          </div>
        </div>
        <div class="cell flex md:items-center" data-label="To">
            <div class="flex flex-col space-y-1">
            ${formatNetworkWithIcon(toChain)}
            ${toAddress == null ? '' : `<div>${toAddress}</div>`}
            </div>
        </div>
        <div class="cell flex md:items-center ${Array.isArray(item.assets) && item.assets.length === 0 ? 'sm-hidden' : ''}"
             data-label="Assets">
            <div class="flex flex-col space-y-1">
            ${
              Array.isArray(item.assets) && item.assets.length > 0
                ? item.assets
                    .map((asset) => {
                      if (asset.decimals !== null) {
                        return `<div>${formatAssetAmount(asset)}</div>`
                      }
                      return '<div class="text-white/20">-</div>'
                    })
                    .join('')
                : '<div class="text-white/20">-</div>'
            }
            </div>
        </div>
        <div class="cell flex md:justify-center md:items-center" data-label="Status" title="${item.status}">
          <div class="flex space-x-2 items-center">
            <img class="table-status ${item.status.toLowerCase()} size-4" src="/icons/${item.status.toLowerCase()}.svg" alt="${item.status.toLowerCase()}" />
            <span class="md:hidden capitalize text-white/60">${item.status}</span>
          </div>
        </div>
      `

    container.appendChild(row)
    requestAnimationFrame(() => {
      row.classList.add('fade-in')
    })
  }

  renderPaginationFooter(pageInfo)
}

function applyFiltersAndRender() {
  listJourneys({
    filters,
    pagination: {
      limit: pageSize,
    },
  })
    .then((results) => {
      currentPage = 0
      pageCursors.length = 1

      renderTransactionsTable(results)
    })
    .catch(console.log)
}

export function loadToggles() {
  const toggles = document.querySelectorAll('[data-toggle]')
  for (const toggle of toggles) {
    toggle.addEventListener('click', () => {
      const targetId = toggle.dataset.target
      const target = document.getElementById(targetId)
      if (target) {
        target.classList.toggle('flex')
        target.classList.toggle('hidden')
      }
    })
  }
}

window.onload = async () => {
  await loadResources()

  loadToggles()
  loadSearch({
    filters,
    update: debounce(applyFiltersAndRender, 300),
  })

  applyFiltersAndRender()
}

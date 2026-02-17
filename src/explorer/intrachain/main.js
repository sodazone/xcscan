import { resolveAddress } from '../addresses.js'
import { listTransfers, subscribeToTransfers } from './api.js'
import {
  formatAssetAmount,
  formatLocalTimestamp,
  formatNetworkWithIconHTML,
  formatUnknownAssetAmount,
  loadResources,
  makeGuardedClickHandler,
} from '../common.js'
import {
  createCopyLinkHTML,
  installCopyEventListener,
} from '../components/copy-link.js'
import { loadFiltersFromSession, saveFiltersToSession } from '../session.js'
import { resolveDeeplinkFilters, updateUrlFromFilters } from '../deeplink.js'
import { debounce } from '../../utils.js'
import {
  getActiveFiltersSummary,
  loadSearch,
  resolveQueryType,
} from './search.js'

const TRANFERS_FILTERS_STORAGE_KEY = 'transfers-filters'

const pageCursors = [null]
let currentPage = 0
const pageSize = 15

let newTransferIds = new Set()

let closeSubscription
const filters = {
  currentSearchTerm: '',
  selectedChains: [],
  selectedAssets: [],
  selectedTypes: ['user'],
  selectedUsdAmounts: {
    amountPreset: null,
    amountGte: null,
    amountLte: null,
  },
}

// duplicate with xc main.js
const searchIndicator = document.getElementById('search-indicator')
const searchIndicatorText = searchIndicator.querySelector(
  '#search-indicator-text'
)
//dup
function updateSearchIndicator() {
  if (filters.currentSearchTerm) {
    searchIndicatorText.textContent = filters.currentSearchTerm
    searchIndicator.classList.remove('hidden')
  } else {
    searchIndicator.classList.add('hidden')
  }
}

function countAppliedFilters() {
  let count = 0
  const arrayKeys = ['selectedChains', 'selectedTypes', 'selectedAssets']

  arrayKeys.forEach((key) => {
    if (Array.isArray(filters[key]) && filters[key].length > 0) {
      count++
    }
  })

  const amounts = filters.selectedUsdAmounts
  if (
    amounts.amountPreset !== null ||
    amounts.amountGte !== null ||
    amounts.amountLte !== null
  ) {
    count++
  }

  return count
}

function updateFiltersCounter() {
  const filtersCounter = document.getElementById('filters-counter')

  if (filtersCounter) {
    const count = countAppliedFilters()
    if (count === 0) {
      filtersCounter.innerText = ''
    } else {
      filtersCounter.innerText = `(${count})`
    }
  }
}

function renderPaginationFooter({ hasNextPage, endCursor }) {
  const paginationFooter = document.querySelector('#pagination-footer')

  if (!paginationFooter) return

  const prevButton = paginationFooter.querySelector('#prev-button')
  const nextButton = paginationFooter.querySelector('#next-button')
  const pageIndicator = paginationFooter.querySelector('#page-indicator')

  prevButton.disabled = currentPage === 0
  nextButton.disabled = !hasNextPage
  pageIndicator.textContent = `Page ${currentPage + 1}`

  makeGuardedClickHandler(prevButton, () => {
    if (currentPage === 0) return Promise.resolve()

    currentPage--
    return renderCurrentPage(pageCursors[currentPage])
  })

  makeGuardedClickHandler(nextButton, () => {
    if (!hasNextPage) return Promise.resolve()

    clearNewTransfersState()

    const nextPageIndex = currentPage + 1
    if (!pageCursors[nextPageIndex]) {
      pageCursors[nextPageIndex] = endCursor
    }
    currentPage = nextPageIndex
    return renderCurrentPage(pageCursors[currentPage])
  })
}

async function renderCurrentPage(cursor) {
  return listTransfers({
    filters,
    pagination: {
      limit: pageSize,
      cursor,
    },
  })
    .then((results) => {
      renderTransfersTable(results)
      updateNewTransfersButton()
    })
    .catch(console.error)
}

function addressHTML({ display, text }) {
  if (display == null || text == null) {
    return ''
  }

  return `<div class="break-all">${createCopyLinkHTML({
    text,
    display,
    url: `/intrachain/?search=a:${text}`,
  })}</div>`
}

function renderFrom(item) {
  const fromAddress = resolveAddress({
    address: item.from,
    formatted: item.fromFormatted,
  })

  return `${addressHTML({
    display: fromAddress,
    text: item.fromFormatted ?? item.from,
  })}`
}

function renderTo(item) {
  const toAddress = resolveAddress({
    address: item.to,
    formatted: item.toFormatted,
  })

  return `${addressHTML({
    display: toAddress,
    text: item.toFormatted ?? item.to,
  })}`
}

function renderTime(item, style) {
  return formatLocalTimestamp(item.sentAt, style)
}

function createTransferRow(item) {
  const row = document.createElement('a')
  row.href = `/transfer/index.html#${item.id}`
  row.tabIndex = 0
  row.id = `transfer-${item.id}`
  row.className = 'transaction-row'

  row.innerHTML = `
    <!-- Mobile -->
    <div class="flex flex-col md:hidden">
      <div class="cell flex justify-between mb-3">
        <div>${renderTime(item)}</div>
        <div class="text-xs text-white/60">${formatNetworkWithIconHTML(item.network, false)}</div>
      </div>

      <div class="cell flex gap-1">
        <div class="text-xs text-white/40 w-[2.5rem]">from</div>
        <div>${renderFrom(item)}</div>
      </div>

      <div class="cell flex gap-1">
        <div class="text-xs text-white/40 w-[2.5rem]">to</div>
        <div>${renderTo(item)}</div>
      </div>

      <div class="cell flex gap-1">
        <div class="text-xs text-white/40 w-[2.5rem]"></div>
        ${formatAssetAmount(item)}
      </div>
    </div>

    <!-- Desktop -->
    <div class="hidden md:grid md:grid-cols-[minmax(100px,1fr)_minmax(120px,1.2fr)_minmax(160px,1.5fr)_minmax(160px,1.5fr)_minmax(160px,1.5fr)] md:items-center">
      <div class="cell" data-label="Time">
        ${renderTime(item)}
      </div>

      <div class="cell" data-label="Network">
        ${formatNetworkWithIconHTML(item.network)}
      </div>

      <div class="cell" data-label="From">
        ${renderFrom(item)}
      </div>

      <div class="cell" data-label="To">
        ${renderTo(item)}
      </div>

      <div class="cell" data-label="Assets">
        ${item.decimals ? formatAssetAmount(item) : formatUnknownAssetAmount(item)}
      </div>
    </div>
  `

  return row
}

function renderNoResults(table) {
  const filterNote = getActiveFiltersSummary(filters)
  const div = document.createElement('div')
  div.className =
    'text-center text-white/50 py-10 text-sm opacity-0 transition-opacity duration-500'
  div.id = 'no-results'

  div.appendChild(document.createTextNode('No results found.'))

  if (filterNote) {
    const note = document.createElement('div')
    note.className = 'mt-2 text-white/40'
    note.textContent = filterNote
    div.appendChild(note)
  }

  table.appendChild(div)
  requestAnimationFrame(() => {
    document.querySelector('#no-results')?.classList.add('opacity-100')
  })
}

function clearNewTransfersState() {
  newTransferIds.clear()
}

function updateNewTransfersButton() {
  const button = document.getElementById('new-transfers-button')
  const text = document.getElementById('new-transfers-text')
  const count = newTransferIds.size

  if (count === 0) {
    button.classList.add('hidden')
    text.innerHTML = ''
    return
  }

  text.innerHTML =
    count === 1
      ? '<span class="font-semibold text-white/90">1</span> <span>new transfer</span>'
      : `<span class="font-semibold text-white/90">${count}</span> <span>new transfers</span>`

  button.classList.remove('hidden')
  button.classList.add('flex')
}

function renderTransfersTable(results) {
  const table = document.querySelector(
    '.transaction-table .transaction-table-body'
  )
  table.innerHTML = ''

  if (results == null) {
    renderNoResults(table)
    return
  }

  const { items, pageInfo } = results

  if (closeSubscription) {
    closeSubscription()
  }

  if (items.length === 0) {
    renderNoResults(table)
    return
  }

  for (const item of items) {
    const row = createTransferRow(item)

    table.appendChild(row)
    requestAnimationFrame(() => {
      row.classList.add('fade-in')
    })
  }

  renderPaginationFooter(pageInfo)

  function onNewTransfer(transfer) {
    if (currentPage !== 0) return

    if (newTransferIds.has(transfer.id)) return

    newTransferIds.add(transfer.id)
    updateNewTransfersButton()
  }

  function liveStatus() {
    const connectedIco = document.getElementById('sse-live-icon-connected')
    const disconnectedIco = document.getElementById(
      'sse-live-icon-disconnected'
    )
    const errorIco = document.getElementById('sse-live-icon-error')

    function showIcon(showIconEl, ...hideIcons) {
      hideIcons.forEach((icon) => {
        if (!icon.classList.contains('hidden')) {
          icon.classList.add('hidden')
        }
      })
      if (showIconEl.classList.contains('hidden')) {
        showIconEl.classList.remove('hidden')
      }
    }

    const onOpen = () => {
      showIcon(connectedIco, disconnectedIco, errorIco)
    }

    const onError = () => {
      showIcon(errorIco, disconnectedIco, connectedIco)
    }

    return { onError, onOpen }
  }

  const { onError, onOpen } = liveStatus()
  closeSubscription = subscribeToTransfers(filters, {
    onNewTransfer,
    onOpen,
    onError,
  })
}

function applyFiltersAndRender() {
  saveFiltersToSession(filters, TRANFERS_FILTERS_STORAGE_KEY)
  updateUrlFromFilters(filters)
  updateFiltersCounter()
  clearNewTransfersState()

  const promise = listTransfers({
    filters,
    pagination: {
      limit: pageSize,
    },
  })
    .then((results) => {
      currentPage = 0
      pageCursors.length = 1

      renderTransfersTable(results)
      updateNewTransfersButton()
    })
    .catch(console.error)

  updateSearchIndicator()

  return promise
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

  const urlParams = new URLSearchParams(window.location.search)
  const deepLinkFilters = urlParams.getAll('filterBy')
  if (deepLinkFilters.length > 0) {
    resolveDeeplinkFilters(filters, deepLinkFilters)
  } else {
    const savedFilters = loadFiltersFromSession(TRANFERS_FILTERS_STORAGE_KEY)
    if (savedFilters) {
      Object.assign(filters, savedFilters)
    }
  }

  installCopyEventListener()

  loadToggles()
  await loadSearch({
    filters,
    update: debounce(applyFiltersAndRender, 300),
  })

  const newTransfersButton = document.getElementById('new-transfers-button')

  newTransfersButton.addEventListener('click', async () => {
    await applyFiltersAndRender()
  })

  const deepSearch = urlParams.get('search')
  const queryType = deepSearch != null ? resolveQueryType(deepSearch) : null

  if (deepSearch && queryType != null) {
    filters.currentSearchTerm = deepSearch

    listTransfers({
      filters,
      pagination: {
        limit: pageSize,
      },
    })
      .then((results) => {
        if (queryType === 'tx' && results.items.length === 1) {
          window.location.href = `/intrachain/tx/index.html#${results.items[0].id}`
        } else {
          currentPage = 0
          pageCursors.length = 1

          saveFiltersToSession(filters, TRANFERS_FILTERS_STORAGE_KEY)
          updateUrlFromFilters(filters)
          renderTransfersTable(results)
        }
      })
      .catch(console.error)

    updateSearchIndicator()
  } else {
    applyFiltersAndRender()
  }
}

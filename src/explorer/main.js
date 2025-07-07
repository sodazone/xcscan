import { debounce } from '../utils.js'
import { listJourneys, subscribeToJourneys } from './api.js'
import {
  asClassName,
  decodeWellKnownAddressHTML,
  formatAssetAmount,
  formatLocalTimestamp,
  formatNetworkWithIconHTML,
  getStatusLabel,
  loadResources,
  makeGuardedClickHandler,
  prettify,
  shortenAddress,
} from './common.js'
import {
  createCopyLinkHTML,
  installCopyEventListener,
} from './components/copy-link.js'
import { loadSearch, resolveQueryType } from './search.js'
import { loadFiltersFromSession, saveFiltersToSession } from './session.js'

const pageCursors = [null]
let currentPage = 0
const pageSize = 15

let closeSubscription
const filters = {
  currentSearchTerm: '',
  selectedDestinations: [],
  selectedOrigins: [],
  selectedChains: [],
  selectedStatus: [],
  selectedActions: [],
  selectedUsdAmounts: {
    amountPreset: null,
    amountGte: null,
    amountLte: null,
  },
  chainPairMode: false,
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

    const nextPageIndex = currentPage + 1
    if (!pageCursors[nextPageIndex]) {
      pageCursors[nextPageIndex] = endCursor
    }
    currentPage = nextPageIndex
    return renderCurrentPage(pageCursors[currentPage])
  })
}

function renderStatus({ status }) {
  const label = getStatusLabel(status)
  const cls = asClassName(label)
  return `
  <div class="cell flex md:justify-center md:items-center" data-label="Status" title="${label}">
          <div class="flex space-x-2 items-center">
            <img class="table-status ${cls} size-4" src="/icons/${cls}.svg" alt="${label}" />
            <span class="md:hidden capitalize text-white/60">${label}</span>
          </div>
        </div>
  `
}

function renderCurrentPage(cursor) {
  return listJourneys({
    filters,
    pagination: {
      limit: pageSize,
      cursor,
    },
  })
    .then((results) => {
      renderTransactionsTable(results)
    })
    .catch(console.error)
}

function renderAction(item) {
  const action = {
    type: item.type,
  }
  if (item.type === 'transact' && item.transactCalls?.length) {
    const call = item.transactCalls[0]
    action.module = call.module
    action.method = prettify(call.method)
  }

  return action.module !== undefined
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

function addressHTML({ display, text }) {
  if (display == null || text == null) {
    return ''
  }

  return `<div class="break-all">${createCopyLinkHTML({
    text,
    display,
    url: `/?search=${text}`,
  })}</div>`
}

function renderFrom(item) {
  const fromChain = item.origin
  const fromAddress = item.from.startsWith('urn')
    ? null
    : shortenAddress(item.fromFormatted ?? item.from)

  return `${formatNetworkWithIconHTML(fromChain)}
            ${addressHTML({
              display: fromAddress,
              text: item.fromFormatted ?? item.from,
            })}`
}

function renderTo(item) {
  const toChain = item.destination
  const toAddress = item.to.startsWith('urn')
    ? null
    : (decodeWellKnownAddressHTML(item.to) ??
      shortenAddress(item.toFormatted ?? item.to))

  return `${formatNetworkWithIconHTML(toChain)}
            ${addressHTML({
              display: toAddress,
              text: item.toFormatted ?? item.to,
            })}`
}

function renderAssets(item) {
  return Array.isArray(item.assets) && item.assets.length > 0
    ? item.assets
        .map((asset) => {
          const fmtAmount = formatAssetAmount(asset)
          if (fmtAmount !== '') {
            return `<div>${fmtAmount}</div>`
          }
          return '<div class="text-white/20">-</div>'
        })
        .join('')
    : '<div class="text-white/20">-</div>'
}

function renderTime(item) {
  return formatLocalTimestamp(item.sentAt)
}

function createJourneyRow(item) {
  const row = document.createElement('a')
  row.href = `/tx/index.html#${item.correlationId}`
  row.tabIndex = 0
  row.id = item.correlationId
  row.className = 'transaction-row'

  row.innerHTML = `
        <div class="cell flex md:items-center" data-label="Time">${renderTime(item)}</div>
        <div class="cell flex md:items-center" data-label="Action">
          ${renderAction(item)}
        </div>
        <div class="cell flex md:items-center" data-label="From">
          <div class="flex flex-col space-y-1">
            ${renderFrom(item)}
          </div>
        </div>
        <div class="cell flex md:items-center" data-label="To">
            <div class="flex flex-col space-y-1">
            ${renderTo(item)}
            </div>
        </div>
        <div class="cell flex md:items-center ${Array.isArray(item.assets) && item.assets.length === 0 ? 'sm-hidden' : ''}"
             data-label="Assets">
            <div class="flex flex-col space-y-1">
            ${renderAssets(item)}
            </div>
        </div>
        ${renderStatus(item)}
        <div class="md:hidden w-full flex items-center px-4">
           <span class="rounded-lg text-xs text-white/80 w-full border border-[#121212] px-4 py-2 text-center">Show Details</span>
        </div>
      `
  return row
}

function renderTransactionsTable({ items, pageInfo }) {
  if (closeSubscription) {
    closeSubscription()
  }

  const table = document.querySelector(
    '.transaction-table .transaction-table-body'
  )
  table.innerHTML = ''

  if (items.length === 0) {
    table.innerHTML = `
            <div class="text-center text-white/50 py-10 text-sm opacity-0 transition-opacity duration-500" id="no-results">
                No results found.
            </div>`
    requestAnimationFrame(() => {
      document.querySelector('#no-results')?.classList.add('opacity-100')
    })
    return
  }

  for (const item of items) {
    const row = createJourneyRow(item)

    table.appendChild(row)
    requestAnimationFrame(() => {
      row.classList.add('fade-in')
    })
  }

  renderPaginationFooter(pageInfo)

  function onUpdateJourney(journey) {
    const existing = items?.find((item) => item.id === journey.id)
    if (existing) {
      if (existing.status === 'sent') {
        existing.status = journey.status

        const row = document.getElementById(journey.correlationId)
        if (!row) {
          console.warn('Row not found for', journey.correlationId)
          return
        }

        const statusCell = row.querySelector('[data-label="Status"]')
        if (!statusCell) return

        const statusLabel = getStatusLabel(journey.status)
        const statusCls = asClassName(statusLabel)

        statusCell.setAttribute('title', statusLabel)

        const img = statusCell.querySelector('img.table-status')
        if (img) {
          img.className = `table-status ${statusCls} size-4`
          img.src = `/icons/${statusCls}.svg`
          img.alt = statusLabel
        }

        const text = statusCell.querySelector('span')
        if (text) {
          text.textContent = statusLabel
        }
      }
    } else {
      console.warn('Journey not found')
    }
  }

  function onNewJourney(journey) {
    if (currentPage === 0) {
      const row = createJourneyRow(journey)
      table.prepend(row)
      requestAnimationFrame(() => row.classList.add('fade-in'))

      items.unshift(journey)

      if (items.length > pageSize) {
        items.pop()

        // update pagination cursor
        const lastItem = items[items.length - 1]
        pageCursors.length = 1
        pageCursors.push(btoa(lastItem.sentAt.toString()))

        const lastRow = table.lastElementChild
        if (lastRow) {
          lastRow.remove()
        }
      }
    }
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
  closeSubscription = subscribeToJourneys(filters, {
    onNewJourney,
    onUpdateJourney,
    onOpen,
    onError,
  })
}

const searchIndicator = document.getElementById('search-indicator')
const searchIndicatorText = searchIndicator.querySelector(
  '#search-indicator-text'
)

function updateSearchIndicator() {
  if (filters.currentSearchTerm) {
    searchIndicatorText.textContent = filters.currentSearchTerm
    searchIndicator.classList.remove('hidden')
  } else {
    searchIndicator.classList.add('hidden')
  }
}

function applyFiltersAndRender() {
  saveFiltersToSession(filters)

  const promise = listJourneys({
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

  const savedFilters = loadFiltersFromSession()
  if (savedFilters) {
    Object.assign(filters, savedFilters)
  }

  installCopyEventListener()

  loadToggles()
  loadSearch({
    filters,
    update: debounce(applyFiltersAndRender, 300),
  })

  const urlParams = new URLSearchParams(window.location.search)
  const deepSearch = urlParams.get('search')
  const queryType = deepSearch != null ? resolveQueryType(deepSearch) : null

  if (deepSearch && queryType != null) {
    filters.currentSearchTerm = deepSearch

    listJourneys({
      filters,
      pagination: {
        limit: pageSize,
      },
    })
      .then((results) => {
        if (queryType.startsWith('tx') && results.items.length === 1) {
          window.location.href = `/tx/index.html#${results.items[0].correlationId}`
        } else {
          currentPage = 0
          pageCursors.length = 1

          saveFiltersToSession(filters)
          renderTransactionsTable(results)
        }
      })
      .catch(console.error)

    updateSearchIndicator()
  } else {
    applyFiltersAndRender()
  }

  if (window.history.replaceState) {
    const cleanUrl = window.location.origin + window.location.pathname
    window.history.replaceState(null, '', cleanUrl)
  }
}

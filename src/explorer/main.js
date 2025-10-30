import { debounce } from '../utils.js'
import { resolveAddress } from './addresses.js'
import { listJourneys, subscribeToJourneys } from './api.js'
import {
  asClassName,
  formatAssetAmount,
  formatLocalTimestamp,
  formatNetworkWithIconHTML,
  getStatusLabel,
  loadResources,
  makeGuardedClickHandler,
  prettify,
} from './common.js'
import {
  createCopyLinkHTML,
  installCopyEventListener,
} from './components/copy-link.js'
import {
  getActiveFiltersSummary,
  loadSearch,
  resolveQueryType,
  resolveDeeplinkFilters,
} from './search.js'
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
  selectedAssets: [],
  selectedProtocols: [],
  selectedUsdAmounts: {
    amountPreset: null,
    amountGte: null,
    amountLte: null,
  },
  chainPairMode: false,
}

function encodeCursor(item) {
  const timestamp =
    typeof item.sentAt === 'number' ? item.sentAt : item.sentAt.getTime()
  return btoa(`${timestamp}|${item.id}`)
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
  return `<div class="flex space-x-2 items-center">
            <img class="table-status ${cls} size-4" src="/icons/${cls}.svg" alt="${label}" />
          </div>`
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
    <div class="flex space-x-2 md:flex-col md:space-y-0.5 text-sm text-white leading-tight tracking-wide break-words">
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
    url: `/?search=a:${text}`,
  })}</div>`
}

function renderFrom(item) {
  const fromChain = item.origin
  const fromAddress = resolveAddress({
    address: item.from,
    formatted: item.fromFormatted,
  })

  return `${formatNetworkWithIconHTML(fromChain)}
            ${addressHTML({
              display: fromAddress,
              text: item.fromFormatted ?? item.from,
            })}`
}

function renderTo(item) {
  const toChain = item.destination
  const toAddress = resolveAddress({
    address: item.to,
    formatted: item.toFormatted,
  })

  return `${formatNetworkWithIconHTML(toChain)}
            ${addressHTML({
              display: toAddress,
              text: item.toFormatted ?? item.to,
            })}`
}

function renderAssets(item) {
  if (!Array.isArray(item.assets) || item.assets.length === 0) {
    return '<div class="text-white/20">-</div>'
  }

  const transfers = item.assets.filter(
    (a) => (a.role ?? 'transfer') === 'transfer'
  )
  const swapsRaw = item.assets.filter(
    (a) => a.role === 'swap_in' || a.role === 'swap_out'
  )
  const trappeds = item.assets.filter((a) => a.role === 'trapped')

  // Group swaps by sequence
  const swapPairs = {}
  for (const swap of swapsRaw) {
    const seq = swap.sequence ?? -1
    if (!swapPairs[seq]) swapPairs[seq] = {}
    swapPairs[seq][swap.role] = swap
  }

  const rendered = []
  let renderedCount = 0
  const maxToShow = 2
  let hiddenCount = 0

  for (const transfer of transfers) {
    const transferStr = formatAssetAmount(transfer)
    if (transferStr) {
      if (renderedCount < maxToShow) {
        rendered.push(`<div>${transferStr}</div>`)
        renderedCount++
      } else {
        hiddenCount++
      }
    }
  }

  for (const pair of Object.values(swapPairs)) {
    const from = formatAssetAmount(pair.swap_in, false)
    const to = formatAssetAmount(pair.swap_out, false)

    if (from && to) {
      if (renderedCount < maxToShow) {
        rendered.push(`
            <div class="text-white text-xs pl-1 flex items-center gap-1">
              <span class="text-white/50">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 6 H6 V0" stroke="currentColor" stroke-width="1"/>
                </svg>
              </span>
              <span>${from}</span>
              <span class="text-white/50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-3">
                  <path fill-rule="evenodd" d="M2 8c0 .414.336.75.75.75h8.69l-1.22 1.22a.75.75 0 1 0 1.06 1.06l2.5-2.5a.75.75 0 0 0 0-1.06l-2.5-2.5a.75.75 0 1 0-1.06 1.06l1.22 1.22H2.75A.75.75 0 0 0 2 8Z" clip-rule="evenodd" />
                </svg>
              </span>
              <span>${to}</span>
            </div>
          `)
        renderedCount++
      } else {
        hiddenCount++
      }
    }
  }

  for (const trapped of trappeds) {
    const amoutStr = formatAssetAmount(trapped)
    if (amoutStr) {
      if (renderedCount < maxToShow) {
        rendered.push(`<div class="flex items-center gap-2 bg-red-500/10 w-fit px-1">
          <div>${amoutStr}</div>
          <div class="text-red-400/80 font-medium text-xs">trapped</div>
        </div>`)
        renderedCount++
      } else {
        hiddenCount++
      }
    }
  }

  if (hiddenCount > 0) {
    rendered.push(
      `<div class="flex items-center justify-center text-white/60 text-xs rounded-full bg-white/10 px-2 py-0.5 leading-tight h-5 w-fit my-2 md:my-0">+${hiddenCount} more</div>`
    )
  }

  return rendered.join('') || '<div class="text-white/20">-</div>'
}

function renderTime(item, style) {
  return formatLocalTimestamp(item.sentAt, style)
}

function createJourneyRow(item) {
  const row = document.createElement('a')
  row.href = `/tx/index.html#${item.correlationId}`
  row.tabIndex = 0
  row.id = item.correlationId
  row.className = 'transaction-row'

  row.innerHTML = `
  <div class="flex flex-col space-y-1 md:hidden">
    <div class="cell flex space-x-2">
      <div class="flex flex-col space-y-2">
        <div>${renderTime(item, 'row')}</div>
        <div>${renderAction(item)}</div>
      </div>
      <div class="ml-auto" data-label="Status">${renderStatus(item)}</div>
    </div>
    <div class="cell flex gap-1">
      <div class="text-xs text-white/40 w-[2.5rem]">from</div>
      <div>${renderFrom(item)}</div>
    </div>
    ${
      item.destination && item.destination != item.origin
        ? `
    <div class="cell flex gap-1">
      <div class="text-xs text-white/40 w-[2.5rem]">to</div>
      <div>${renderTo(item)}</div>
    </div>
    `
        : ''
    }
    <div class="cell ${Array.isArray(item.assets) && item.assets.length === 0 ? 'hidden' : 'flex gap-1'}">
      <div class="text-xs text-white/40 w-[2.5rem]"></div>
      <div data-label="Assets">${renderAssets(item)}</div>
    </div>
  </div>

  <div class="hidden md:grid md:gap-y-1 md:grid-cols-[minmax(80px,_1fr)_minmax(100px,_1.2fr)_minmax(150px,_1.5fr)_minmax(150px,_1.5fr)_minmax(150px,_1.5fr)_minmax(90px,_90px)]">
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
        ${
          item.destination && item.destination != item.origin
            ? `
            <div class="flex flex-col space-y-1">
            ${renderTo(item)}
            </div>
        `
            : '<div class="text-white/20">-</div>'
        }
        </div>
        <div class="cell flex md:items-center ${Array.isArray(item.assets) && item.assets.length === 0 ? 'sm-hidden' : ''}">
            <div class="flex flex-col space-y-1" data-label="Assets">
            ${renderAssets(item)}
            </div>
        </div>
        <div class="cell flex  md:justify-center md:items-center" data-label="Status">
          ${renderStatus(item)}
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

function renderTransactionsTable(results) {
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
    const row = createJourneyRow(item)

    table.appendChild(row)
    requestAnimationFrame(() => {
      row.classList.add('fade-in')
    })
  }

  renderPaginationFooter(pageInfo)

  function isStatusInFilter(journey, filters) {
    return (
      filters?.selectedStatus &&
      filters?.selectedStatus.length > 0 &&
      filters?.selectedStatus.includes(journey.status)
    )
  }

  function isStatusNotInFilter(journey, filters) {
    return (
      filters?.selectedStatus &&
      filters?.selectedStatus.length > 0 &&
      !filters?.selectedStatus.includes(journey.status)
    )
  }

  function onUpdateJourney(journey, filters) {
    const existing = items?.find((item) => item.id === journey.id)
    if (existing && existing.status === 'sent') {
      if (isStatusNotInFilter(journey, filters)) {
        // If updated status no longer matches filter, remove it
        const index = items.findIndex((item) => item.id === journey.id)
        if (index > -1) {
          items.splice(index, 1)
          const row = document.getElementById(journey.correlationId)
          if (row) row.remove()
        }
        return
      }
      existing.status = journey.status

      const row = document.getElementById(journey.correlationId)
      if (!row) {
        console.warn('Row not found for', journey.correlationId)
        return
      }

      const statusCells = row.querySelectorAll('[data-label="Status"]')
      if (statusCells == null || statusCells.length < 1) return

      const statusLabel = getStatusLabel(journey.status)
      const statusCls = asClassName(statusLabel)

      statusCells.forEach((statusCell) => {
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
      })

      // Update the assets
      const assetCells = row.querySelectorAll('[data-label="Assets"]')
      if (assetCells && assetCells.length > 0) {
        const assetsHTML = renderAssets(journey)
        assetCells.forEach((assetCell) => {
          assetCell.innerHTML = assetsHTML
        })
      }
    } else if (isStatusInFilter(journey, filters)) {
      onNewJourney(journey)
    } else {
      console.warn('Journey not found')
    }
  }

  function onNewJourney(journey, filters) {
    if (isStatusNotInFilter(journey, filters)) {
      return
    }
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
        pageCursors.push(encodeCursor(lastItem))

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

  const urlParams = new URLSearchParams(window.location.search)
  const deepLinkFilters = urlParams.getAll('filterBy')
  if (deepLinkFilters.length > 0) {
    resolveDeeplinkFilters(filters, deepLinkFilters)
  } else {
    const savedFilters = loadFiltersFromSession()
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
        if (queryType === 'tx' && results.items.length === 1) {
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

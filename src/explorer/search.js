import { NetworkInfos, resolveNetworkName } from '../extras.js'
import {
  getStatusLabel,
  selectableActions,
  selectableStatus,
} from './common.js'

import { MultiCheckboxDropdown } from './components/multi-checkbox-dropdown.js'

export function isValidQuery(value) {
  const trimmed = value.trim()

  // EVM address (0x-prefixed, 40 hex chars)
  const isEvmAddress = /^0x[a-fA-F0-9]{40}$/.test(trimmed)

  // SS58 address (47-48 chars typical, base58)
  const isSs58Address = /^[1-9A-HJ-NP-Za-km-z]{38,60}$/.test(trimmed)

  // Tx hash (usually 0x + 64 hex chars)
  const isTxHash = /^0x[a-fA-F0-9]{64}$/.test(trimmed)

  return isEvmAddress || isSs58Address || isTxHash
}

function loadStatusFilter(ctx) {
  MultiCheckboxDropdown({
    containerId: 'filter-status-content',
    items: selectableStatus,
    labelResolver: getStatusLabel,
    valueResolver: (s) => s,
    resolveCollection: () => ctx.filters.selectedStatus,
    onUpdate: ctx.update,
  })
}

function loadActionsFilter(ctx) {
  MultiCheckboxDropdown({
    containerId: 'filter-actions-content',
    items: selectableActions,
    resolveCollection: () => ctx.filters.selectedActions,
    onUpdate: ctx.update,
  })
}

function loadChainsFilter(ctx) {
  const chains = Object.values(NetworkInfos).map((chain) => ({
    ...chain,
    label: resolveNetworkName(chain.urn) ?? chain.urn,
  }))

  chains.sort((a, b) => a.label.localeCompare(b.label))

  const { updateLabels, getCheckboxes } = MultiCheckboxDropdown({
    containerId: 'filter-chains-content',
    items: chains,
    type: '',
    labelResolver: (c) => c.label,
    valueResolver: (c) => c.urn,
    resolveCollection: (el) =>
      el.dataset.filter === 'origin'
        ? ctx.filters.selectedOrigins
        : ctx.filters.selectedDestinations,
    onUpdate: ctx.update,
    groupBy: [
      { label: 'Origin', type: 'origin' },
      { label: 'Destination', type: 'destination' },
    ],
  })

  // Disable same values
  const syncDisabledStates = () => {
    const originChecked = Array.from(
      document.querySelectorAll('input[data-filter="origin"]:checked')
    ).map((el) => el.value)
    const destChecked = Array.from(
      document.querySelectorAll('input[data-filter="destination"]:checked')
    ).map((el) => el.value)

    for (const input of document.querySelectorAll(
      'input[data-filter="origin"]'
    )) {
      input.disabled = destChecked.includes(input.value)
    }

    for (const input of document.querySelectorAll(
      'input[data-filter="destination"]'
    )) {
      input.disabled = originChecked.includes(input.value)
    }
  }

  document
    .getElementById('filter-chains-content')
    .addEventListener('change', (e) => {
      if (e.target.matches('input[data-filter]')) {
        syncDisabledStates()
      }
    })

  document
    .getElementById('clear-filter-chains')
    .addEventListener('click', () => {
      ctx.filters.selectedOrigins.length = 0
      ctx.filters.selectedDestinations.length = 0
      let filterDirty = false
      const checkboxes = getCheckboxes()
      for (const checkbox of checkboxes) {
        if (checkbox.checked) filterDirty = true
        checkbox.checked = false
      }
      updateLabels()
      if (filterDirty) {
        ctx.update()
      }
    })
}

function setupToggles() {
  const toggles = document.querySelectorAll('.dropdown-toggle')
  const dropdowns = document.querySelectorAll('.dropdown')
  const dropdownMenus = document.querySelectorAll('.dropdown-menu')

  function hideAll() {
    for (const m of dropdownMenus) {
      m.classList.add('hidden')
    }
    for (const d of dropdowns) {
      d.classList.remove('open')
    }
  }

  for (const toggle of toggles) {
    toggle.addEventListener('click', () => {
      const dropdown = toggle.closest('.dropdown')
      const menu = dropdown.querySelector('.dropdown-menu')

      const isHidden = menu.classList.contains('hidden')

      hideAll()

      if (isHidden) {
        menu.classList.remove('hidden')
        dropdown.classList.add('open')
      } else {
        menu.classList.add('hidden')
        dropdown.classList.remove('open')
      }
    })
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
      hideAll()
    }
  })

  const dataCloseBtns = document.querySelectorAll('[data-dropdown-close]')
  for (const button of dataCloseBtns) {
    button.addEventListener('click', () => {
      hideAll()
    })
  }
}

export function loadSearch(ctx) {
  const searchForm = document.getElementById('search')
  const inputError = document.getElementById('search-input-error')
  const input = searchForm.querySelector('input[name="query"]')
  const searchIndicatorClear = document.getElementById('search-indicator-clear')

  searchIndicatorClear.addEventListener('click', () => {
    ctx.filters.currentSearchTerm = null
    ctx.update()
  })

  if (searchForm) {
    const submitButton = searchForm.querySelector('button[type="submit"]')

    searchForm.addEventListener('submit', (e) => {
      e.preventDefault()

      if (submitButton.disabled) {
        return
      }

      const data = new FormData(e.target)
      const dataObject = Object.fromEntries(data.entries())
      const query = (dataObject.query ?? '').trim()

      if (isValidQuery(query)) {
        inputError.classList.add('hidden')
        input.classList.remove('border-[#b34d4d]', 'ring-1', 'ring-[#b34d4d')
        input.removeAttribute('aria-invalid')
      } else {
        inputError.classList.remove('hidden')
        input.classList.add('border-[#b34d4d]', 'ring-1', 'ring-[#b34d4d]')
        input.setAttribute('aria-invalid', 'true')
        input.value = ''
        return
      }

      submitButton.disabled = true

      ctx.filters.currentSearchTerm = query
      ctx.update().finally(() => {
        submitButton.disabled = false
      })
    })
  }

  loadChainsFilter(ctx)
  loadActionsFilter(ctx)
  loadStatusFilter(ctx)
  setupToggles()
}

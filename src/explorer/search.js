import { NetworkInfos, resolveNetworkName } from '../extras.js'
import { humanizeNumber } from '../formats.js'
import {
  enforceNumericInput,
  getStatusLabel,
  selectableActions,
  selectableStatus,
} from './common.js'

import {
  MultiCheckboxDropdown,
  setupToggles,
} from './components/multi-checkbox-dropdown.js'
import { createSwitch } from './components/switch.js'

export function resolveQueryType(value) {
  const trimmed = value.trim()

  // EVM address (0x-prefixed, 40 hex chars)
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return 'address-evm'
  }
  // SS58 address (47-48 chars typical, base58)
  if (/^[1-9A-HJ-NP-Za-km-z]{38,60}$/.test(trimmed)) {
    return 'address-ss58'
  }
  // Tx hash (usually 0x + 64 hex chars)
  if (/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
    return 'tx-hash'
  }

  return null
}

export function isValidQuery(value) {
  return resolveQueryType(value) !== null
}

function loadStatusFilter(ctx) {
  const dropdown = MultiCheckboxDropdown({
    containerId: 'filter-status-content',
    items: selectableStatus,
    labelResolver: getStatusLabel,
    valueResolver: (s) => s,
    resolveCollection: () => ctx.filters.selectedStatus,
    onUpdate: ctx.update,
  })

  return {
    reset: () => {
      ctx.filters.selectedStatus.length = 0
      dropdown.reset()
    },
  }
}

function loadActionsFilter(ctx) {
  const dropdown = MultiCheckboxDropdown({
    containerId: 'filter-actions-content',
    items: selectableActions,
    resolveCollection: () => ctx.filters.selectedActions,
    onUpdate: ctx.update,
  })

  return {
    reset: () => {
      ctx.filters.selectedActions.length = 0
      dropdown.reset()
    },
  }
}

function loadChainsFilter(ctx) {
  const switchElement = document.getElementById('filter-chains-switch')
  const flatContainer = document.getElementById('filter-chain-content')
  const groupedContainer = document.getElementById('filter-chains-content')

  const chains = Object.values(NetworkInfos)
    .map((chain) => ({
      ...chain,
      label: resolveNetworkName(chain.urn) ?? chain.urn,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  // Chains
  const flatDropdown = MultiCheckboxDropdown({
    containerId: 'filter-chain-content',
    items: chains,
    type: 'flat',
    labelResolver: (c) => c.label,
    valueResolver: (c) => c.urn,
    resolveCollection: () => ctx.filters.selectedChains,
    onUpdate: ctx.update,
    groupBy: null,
  })

  // Origin Destination pairs
  const groupedDropdown = MultiCheckboxDropdown({
    containerId: 'filter-chains-content',
    items: chains,
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

  const switchMode = createSwitch(switchElement, ctx.filters.chainPairMode)

  switchElement.addEventListener('switch-change', ({ detail }) => {
    updateMode(detail.on)
    ctx.update()
  })

  updateMode(ctx.filters.chainPairMode)

  function reset() {
    ctx.filters.selectedChains.length = 0
    ctx.filters.selectedOrigins.length = 0
    ctx.filters.selectedDestinations.length = 0
    ctx.filters.chainPairMode = false

    flatDropdown.reset()
    groupedDropdown.reset()
    switchMode.reset()
    updateMode(false)

    ctx.update()
  }

  function updateLabels() {
    if (ctx.filters.chainPairMode) {
      groupedDropdown.updateLabels()
    } else {
      flatDropdown.updateLabels()
    }
  }

  function updateMode(grouped) {
    ctx.filters.chainPairMode = grouped

    if (grouped) {
      ctx.filters.selectedChains.length = 0
      flatDropdown.getCheckboxes().forEach((cb) => {
        cb.checked = false
        cb.disabled = false
      })
    } else {
      ctx.filters.selectedOrigins.length = 0
      ctx.filters.selectedDestinations.length = 0
      groupedDropdown.getCheckboxes().forEach((cb) => {
        cb.checked = false
        cb.disabled = false
      })
    }

    flatContainer.style.display = grouped ? 'none' : 'grid'
    groupedContainer.style.display = grouped ? 'grid' : 'none'
    flatDropdown.searchInput.style.display = grouped ? 'none' : 'flex'
    groupedDropdown.searchInput.style.display = grouped ? 'flex' : 'none'

    updateLabels()
  }

  document
    .getElementById('clear-filter-chains')
    .addEventListener('click', reset)

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
      const checkboxes = flatDropdown.getCheckboxes()
      for (const checkbox of checkboxes) {
        if (checkbox.checked) filterDirty = true
        checkbox.checked = false
        checkbox.disabled = false
      }
      updateLabels()
      if (filterDirty) {
        ctx.update()
      }
    })

  syncDisabledStates()

  return {
    reset,
  }
}

function loadAmountFilter(ctx) {
  const gteInput = enforceNumericInput(
    document.getElementById('filter-usd-amount-gte')
  )
  const lteInput = enforceNumericInput(
    document.getElementById('filter-usd-amount-lte')
  )
  const presetRadios = document.querySelectorAll(
    'input[name="filter-usd-amount-preset"]'
  )
  const applyButton = document.getElementById('filter-usd-amount-apply')
  const resetButton = document.getElementById('filter-usd-amount-reset')

  const labelEl = document.querySelector(
    '#filter-usd-amount [data-dropdown-labels]'
  )
  const dropdown = document
    .getElementById('filter-usd-amount-content')
    ?.closest('.dropdown')
  const dropdownMenu = dropdown?.querySelector('.dropdown-menu')

  function updateLabelFromFilters({ amountPreset, amountGte, amountLte }) {
    let label = 'All'

    if (amountPreset) {
      if (amountPreset === '') {
        label = 'All'
      } else if (amountPreset.endsWith('+')) {
        label = `≥ $${humanizeNumber(amountPreset.replace('+', ''))}`
      } else if (amountPreset.includes('-')) {
        const [min, max] = amountPreset.split('-')
        label = `$${humanizeNumber(min)}–${humanizeNumber(max)}`
      }
    } else if (amountGte != null || amountLte != null) {
      if (amountGte != null && amountLte != null) {
        label = `$${humanizeNumber(amountGte)}–${humanizeNumber(amountLte)}`
      } else if (amountGte != null) {
        label = `≥ $${humanizeNumber(amountGte)}`
      } else if (amountLte != null) {
        label = `≤ $${humanizeNumber(amountLte)}`
      }
    }

    if (labelEl) {
      labelEl.textContent = label
    }
  }

  function applyAmountsFilter() {
    updateLabelFromFilters(ctx.filters.selectedUsdAmounts)
    dropdownMenu?.classList.add('hidden')
    dropdown?.classList.remove('open')
    ctx.update()
  }

  function hydrateFromCtx() {
    const f = ctx.filters.selectedUsdAmounts || {}

    gteInput.value = f.amountGte != null ? f.amountGte : ''
    lteInput.value = f.amountLte != null ? f.amountLte : ''
    presetRadios.forEach((r) => {
      r.checked = r.value === f.amountPreset
    })

    updateLabelFromFilters(f)
  }

  presetRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        gteInput.value = ''
        lteInput.value = ''
      }
    })
  })

  function handleCustomInput() {
    presetRadios.forEach((r) => (r.checked = false))
  }

  gteInput.addEventListener('input', handleCustomInput)
  lteInput.addEventListener('input', handleCustomInput)

  applyButton.addEventListener('click', () => {
    const gte = parseFloat(gteInput.value)
    const lte = parseFloat(lteInput.value)
    const selectedPreset = [...presetRadios].find((r) => r.checked)?.value

    ctx.filters.selectedUsdAmounts = {
      amountPreset: selectedPreset || null,
      amountGte: isNaN(gte) ? null : gte,
      amountLte: isNaN(lte) ? null : lte,
    }

    applyAmountsFilter()
  })

  function reset() {
    gteInput.value = ''
    lteInput.value = ''
    presetRadios.forEach((r) => (r.checked = false))

    ctx.filters.selectedUsdAmounts = {
      amountPreset: null,
      amountGte: null,
      amountLte: null,
    }

    applyAmountsFilter()
  }

  if (resetButton) {
    resetButton.addEventListener('click', reset)
  }

  hydrateFromCtx()

  return {
    reset,
  }
}

export function getActiveFiltersSummary(filters) {
  const parts = []

  if (filters.selectedOrigins.length > 0) {
    parts.push(`Origins: ${filters.selectedOrigins.join(', ')}`)
  }
  if (filters.selectedDestinations.length > 0) {
    parts.push(`Destinations: ${filters.selectedDestinations.join(', ')}`)
  }
  if (filters.selectedChains.length > 0) {
    parts.push(`Chains: ${filters.selectedChains.join(', ')}`)
  }
  if (filters.selectedStatus.length > 0) {
    parts.push(`Status: ${filters.selectedStatus.join(', ')}`)
  }
  if (filters.selectedActions.length > 0) {
    parts.push(`Actions: ${filters.selectedActions.join(', ')}`)
  }

  const { amountPreset, amountGte, amountLte } = filters.selectedUsdAmounts
  if (amountPreset || amountGte || amountLte) {
    const partsUsd = []
    if (amountPreset) partsUsd.push(`preset = ${amountPreset}`)
    if (amountGte) partsUsd.push(`min = ${amountGte}`)
    if (amountLte) partsUsd.push(`max = ${amountLte}`)
    parts.push(`USD amount: ${partsUsd.join(', ')}`)
  }

  return parts.length > 0 ? parts.join(' and ') : null
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

  const chainsFilter = loadChainsFilter(ctx)
  const actionsFilter = loadActionsFilter(ctx)
  const statusFilter = loadStatusFilter(ctx)
  const amountFilter = loadAmountFilter(ctx)

  function resetAllFilters() {
    chainsFilter.reset()
    actionsFilter.reset()
    statusFilter.reset()
    amountFilter.reset()
  }

  document
    .getElementById('filters-reset-all')
    .addEventListener('click', resetAllFilters)

  setupToggles()
}

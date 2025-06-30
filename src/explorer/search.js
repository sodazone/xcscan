import { NetworkInfos, resolveNetworkName } from '../extras.js'
import { humanizeNumber } from '../formats.js'
import {
  enforceNumericInput,
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
        checkbox.disabled = false
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

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      gteInput.value = ''
      lteInput.value = ''
      presetRadios.forEach((r) => (r.checked = false))

      ctx.filters.selectedUsdAmounts = {
        amountPreset: null,
        amountGte: null,
        amountLte: null,
      }

      applyAmountsFilter()
    })
  }

  hydrateFromCtx()
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
  loadAmountFilter(ctx)
  setupToggles()
}

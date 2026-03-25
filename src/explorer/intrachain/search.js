import { NetworkInfos, resolveNetworkName } from '../../extras.js'
import { humanizeNumber } from '../../formats.js'
// import { fetchFilterableAssets } from './api.js'
import { assetIconHTML, enforceNumericInput } from '../common.js'

import {
  MultiCheckboxDropdown,
  setupToggles,
} from '../components/multi-checkbox-dropdown.js'
import { fetchFilterableAssets, fetchFilterableNetworks } from './api.js'

let filterableAssets = []

export function resolveQueryType(value) {
  const trimmed = value.trim()

  if (trimmed.startsWith('a:')) {
    return 'address'
  }

  if (trimmed.startsWith('t:')) {
    return 'tx'
  }

  // EVM address (0x-prefixed, 40 hex chars)
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return 'address'
  }
  // SS58 address (47-48 chars typical, base58)
  if (/^[1-9A-HJ-NP-Za-km-z]{38,60}$/.test(trimmed)) {
    return 'address'
  }
  // Tx hash (usually 0x + 64 hex chars)
  if (/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
    return 'tx'
  }

  return null
}

export function isValidQuery(value) {
  return resolveQueryType(value) !== null
}

async function loadAssetsFilter(ctx) {
  filterableAssets = (await fetchFilterableAssets())
    .filter((a) => a.symbol !== undefined && a.symbol !== null)
    .slice(0, 100)

  const assetRenderer = (asset) => {
    return `
      <div class="flex space-x-2 items-center ml-2">
        ${assetIconHTML(asset, true)}
        <span>${asset.symbol ?? 'unknown'}</span>
      </div>`
  }

  const dropdown = MultiCheckboxDropdown({
    containerId: 'filter-assets-content',
    items: filterableAssets,
    labelResolver: (a) => a.symbol ?? a.asset,
    labelRenderer: assetRenderer,
    valueResolver: (a) => a.asset,
    resolveCollection: () => ctx.filters.selectedAssets,
    onUpdate: ctx.update,
    searchMaxDistance: 1,
  })

  document
    .getElementById('clear-filter-assets')
    .addEventListener('click', () => {
      ctx.filters.selectedAssets.length = 0
      dropdown.reset()
      ctx.update()
    })

  return {
    reset: () => {
      ctx.filters.selectedAssets.length = 0
      dropdown.reset()
    },
  }
}

async function loadChainsFilter(ctx) {
  const fc = await fetchFilterableNetworks()
  const chains = fc
    .map((chainId) => ({
      urn: chainId,
      label: resolveNetworkName(chainId) ?? chainId,
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

  function reset() {
    ctx.filters.selectedChains.length = 0
    flatDropdown.reset()

    ctx.update()
  }

  document
    .getElementById('clear-filter-chains')
    .addEventListener('click', reset)

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

const selectableTypes = ['user', 'mixed', 'system']
export const typeLabels = {
  user: 'Wallet',
  mixed: 'Wallet to Protocol',
  system: 'Protocol',
}
export const typeDescriptions = {
  user: 'Transfers between two user wallets.',
  mixed:
    'Transfers between a wallet and a protocol account (staking, treasury, DEX, etc.).',
  system: 'Transfers between protocol or system accounts only.',
}

export function getTypeLabel(type) {
  return typeLabels[type.toLowerCase()] ?? 'Unknown'
}
export function getTypeDescription(type) {
  return typeDescriptions[type.toLowerCase()] ?? 'Unknown transfer type'
}

function loadTypeFilter(ctx) {
  const dropdown = MultiCheckboxDropdown({
    containerId: 'filter-type-content',
    items: selectableTypes,
    labelResolver: getTypeLabel,
    valueResolver: (s) => s,
    resolveCollection: () => ctx.filters.selectedTypes,
    onUpdate: ctx.update,
  })

  return {
    reset: () => {
      ctx.filters.selectedTypes.length = 0
      dropdown.reset()
    },
  }
}

function buildChainsSummary(chains) {
  return chains.map((chain) => resolveNetworkName(chain) ?? chain).join(', ')
}

export function getActiveFiltersSummary(filters) {
  const parts = []

  if (filters.selectedChains.length > 0) {
    parts.push(`Chains: ${buildChainsSummary(filters.selectedChains)}`)
  }
  if (filters.selectedAssets.length > 0) {
    parts.push(
      `Assets: ${filters.selectedAssets.map((a) => filterableAssets.find(({ asset }) => a === asset)?.symbol ?? a).join(', ')}`
    )
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

export async function loadSearch(ctx) {
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

  const chainsFilter = await loadChainsFilter(ctx)
  const amountFilter = loadAmountFilter(ctx)
  const assetsFilter = await loadAssetsFilter(ctx)
  const typesFilter = loadTypeFilter(ctx)

  function resetAllFilters() {
    chainsFilter.reset()
    amountFilter.reset()
    assetsFilter.reset()
    typesFilter.reset()
  }

  document
    .getElementById('filters-reset-all')
    .addEventListener('click', resetAllFilters)

  setupToggles()
}

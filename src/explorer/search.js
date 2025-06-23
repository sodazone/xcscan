import { NetworkInfos, resolveNetworkName } from '../extras.js'
import { getStatusLabel, selectableStatus } from './common.js'

let filterDirty = false

function applyIfDirty(update) {
  if (!filterDirty) {
    return
  }

  filterDirty = false
  update()
}

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

function collectionUpdater(filter, resolveCollection, update) {
  const checkboxes = Array.from(filter.querySelectorAll('input[type=checkbox]'))
  const labels = filter
    .closest('.dropdown')
    .querySelector('[data-dropdown-labels]')

  function updateLabels() {
    if (filterDirty) {
      const checked = checkboxes.filter((c) => c.checked)
      const labelsList = checked.map((c) => c.parentElement.textContent.trim())
      const maxVisible = 2

      let display = ''

      if (labelsList.length === 0) {
        display = 'All'
      } else if (labelsList.length <= maxVisible) {
        display = labelsList.join(', ')
      } else {
        const visible = labelsList.slice(0, maxVisible).join(', ')
        const remaining = labelsList.length - maxVisible
        display = `${visible}, +${remaining}`
      }

      labels.textContent = display
    }
  }

  for (const checkbox of checkboxes) {
    checkbox.addEventListener('change', ({ currentTarget }) => {
      const collection = resolveCollection(currentTarget)
      const value = currentTarget.value
      const isChecked = currentTarget.checked
      const index = collection.indexOf(value)

      if (isChecked && index === -1) {
        collection.push(value)
        filterDirty = true
      } else if (!isChecked && index !== -1) {
        collection.splice(index, 1)
        filterDirty = true
      }

      updateLabels()
      applyIfDirty(update)
    })
  }

  return {
    updateLabels,
  }
}

function loadStatusFilter(ctx) {
  const filter = document.getElementById('filter-status-content')
  filter.innerHTML = `<div
    class="flex flex-col gap-2 text-sm text-white/80"
  >
    ${selectableStatus
      .map((s) => {
        return `<label class="grow p-2" for="status-filter-${s}">
                    <input id="status-filter-${s}" value="${s}" type="checkbox" class="mr-2" />
                    ${getStatusLabel(s)}
                </label>`
      })
      .join('')}
  </div>`

  collectionUpdater(filter, () => ctx.filters.selectedStatus, ctx.update)
}

function loadChainsFilter(ctx) {
  const chains = Object.values(NetworkInfos)
  const filter = document.getElementById('filter-chains-content')

  filter.innerHTML = `<div class="flex gap-x-6 text-sm text-white/80 overflow-y-auto max-h-screen md:max-h-80 w-full">
        <div class="flex flex-col gap-2 grow">
            <span class="text-white/50 text-xs font-semibold">Origin</span>
            ${chains
              .map((chain) => {
                return `<label class="grow p-2" for="o-${chain.urn}">
                    <input id="o-${chain.urn}" data-filter="origin" value="${chain.urn}" type="checkbox" class="mr-2" />
                    ${resolveNetworkName(chain.urn) ?? chain.urn}
                </label>`
              })
              .join('')}
        </div>
        <div class="flex flex-col gap-2 grow">
            <span class="text-white/50 text-xs font-semibold">Destination</span>
            ${chains
              .map((chain) => {
                return `<label class="grow p-2" for="d-${chain.urn}">
                    <input id="d-${chain.urn}" data-filter="destination" value="${chain.urn}" type="checkbox" class="mr-2" />
                    ${resolveNetworkName(chain.urn) ?? chain.urn}
                </label>`
              })
              .join('')}
        </div>
    </div>`

  const { updateLabels } = collectionUpdater(
    filter,
    (currentTarget) =>
      currentTarget.dataset.filter === 'origin'
        ? ctx.filters.selectedOrigins
        : ctx.filters.selectedDestinations,
    ctx.update
  )

  document
    .getElementById('clear-filter-chains')
    .addEventListener('click', () => {
      ctx.filters.selectedOrigins.length = 0
      ctx.filters.selectedDestinations.length = 0
      const checkboxes = filter.querySelectorAll('input[type=checkbox]')
      for (const checkbox of checkboxes) {
        if (checkbox.checked) {
          filterDirty = true
        }
        checkbox.checked = false
      }
      updateLabels()
      applyIfDirty(ctx.update)
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
  loadStatusFilter(ctx)
  setupToggles()
}

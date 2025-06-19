import { NetworkInfos, resolveNetworkName } from '../extras.js'

let filterDirty = false

function applyIfDirty(update) {
  if (!filterDirty) {
    return
  }

  filterDirty = false
  update()
}

function collectionUpdater(filter, resolveCollection, update) {
  const checkboxes = filter.querySelectorAll('input[type=checkbox]')
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

      applyIfDirty(update)
    })
  }
}

function loadStatusFilter(ctx) {
  const status = [
    {
      label: 'Sent',
      value: 'sent',
    },
    {
      label: 'Received',
      value: 'received',
    },
    {
      label: 'Failed',
      value: 'failed',
    },
  ]

  const filter = document.getElementById('filter-status-content')
  filter.innerHTML = `<div
    class="flex flex-col gap-2 text-sm text-white/80"
  >
    ${status
      .map((s) => {
        return `<label class="grow" for="status-filter-${s.value}">
                    <input id="status-filter-${s.value}" value="${s.value}" type="checkbox" class="mr-2" />
                    ${s.label}
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
                return `<label class="grow" for="o-${chain.urn}">
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
                return `<label for="d-${chain.urn}">
                    <input id="d-${chain.urn}" data-filter="destination" value="${chain.urn}" type="checkbox" class="mr-2" />
                    ${resolveNetworkName(chain.urn) ?? chain.urn}
                </label>`
              })
              .join('')}
        </div>
    </div>`

  collectionUpdater(
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
        checkbox.checked = false
      }
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

  const dataCloseBtns = document.querySelectorAll('[data-close]')
  for (const button of dataCloseBtns) {
    button.addEventListener('click', () => {
      const menu = button.closest('.dropdown-menu')
      if (menu) menu.classList.add('hidden')
    })
  }
}

export function loadSearch(ctx) {
  const searchForm = document.getElementById('search')
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault()
      const data = new FormData(e.target)
      const dataObject = Object.fromEntries(data.entries())
      ctx.filters.currentSearchTerm = (dataObject.query ?? '').trim()
      ctx.update()
    })
  }

  loadChainsFilter(ctx)
  loadStatusFilter(ctx)
  setupToggles()
}

export function setupToggles() {
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

export function MultiCheckboxDropdown({
  containerId,
  items,
  type = '',
  labelResolver = (item) => item.label ?? item,
  valueResolver = (item) => item.value ?? item,
  resolveCollection,
  onUpdate,
  maxVisible = 2,
  groupBy = null,
}) {
  const container = document.getElementById(containerId)
  const labelsEl = container
    .closest('.dropdown')
    .querySelector('[data-dropdown-labels]')

  let filterDirty = false

  function applyIfDirty(update) {
    if (!filterDirty) {
      return
    }

    filterDirty = false
    update()
  }

  function renderCheckbox(item, itemType = type) {
    const id = `${itemType}-${valueResolver(item)}`
    return `
      <label for="${id}" class="group flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-white/80 
        hover:bg-white/5 
        has-[:checked]:bg-white/10 
        has-[:checked]:text-white 
        has-[:disabled]:opacity-40 
        has-[:disabled]:cursor-not-allowed">
        <input
          id="${id}"
          ${itemType ? `data-filter="${itemType}"` : ''}
          value="${valueResolver(item)}"
          type="checkbox"
          class="accent-white"
        />
        <span>${labelResolver(item)}</span>
      </label>`
  }

  const grouped = groupBy
    ? groupBy.map(({ label: groupLabel, type: filterType }) => {
        const groupItems = items
        return `
        <div class="flex flex-col gap-2 grow">
          <span class="text-white/50 text-xs font-semibold">${groupLabel}</span>
          ${groupItems.map((item) => renderCheckbox(item, filterType)).join('')}
        </div>`
      })
    : [
        `<div class="flex flex-col gap-2 grow">${items.map(renderCheckbox).join('')}</div>`,
      ]

  container.innerHTML = `
    <div class="flex gap-x-6 text-sm text-white/80 overflow-y-auto max-h-screen md:max-h-80 w-full">
      ${grouped.join('')}
    </div>
  `

  const checkboxes = Array.from(
    container.querySelectorAll('input[type=checkbox]')
  )

  checkboxes.forEach((checkbox) => {
    const collection = resolveCollection(checkbox)
    checkbox.checked = collection.includes(checkbox.value)
  })

  function updateLabels() {
    const checked = checkboxes.filter((c) => c.checked)
    const labelsList = checked.map((c) => c.parentElement.textContent.trim())

    let display = 'All'

    if (labelsList.length > 0 && labelsList.length <= maxVisible) {
      display = labelsList.join(', ')
    } else if (labelsList.length > maxVisible) {
      display = `${labelsList.slice(0, maxVisible).join(', ')}, +${labelsList.length - maxVisible}`
    }
    labelsEl.textContent = display
  }

  updateLabels()

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
      applyIfDirty(onUpdate)
    })
  }

  return {
    updateLabels,
    getCheckboxes: () => checkboxes,
    reset: () => {
      checkboxes.forEach((cb) => {
        cb.checked = false
        cb.disabled = false
      })
      updateLabels()
    },
  }
}

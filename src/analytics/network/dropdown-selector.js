const descriptions = {
  volume: 'Total volume in USD',
  count: 'Number of transfers',
  flow: 'Inflow, outflow and netflow in USD',
  share: 'Volume share over total ecosystem',
  asset: 'Total volume in asset amount',
}

const labels = {
  volume: 'Volume USD',
  count: 'Transfers',
  flow: 'Netflow USD',
  share: 'Share %',
  asset: 'Amount',
}

export function setupDropdownSelector(
  container,
  labelElement,
  eventName,
  initial = 'volume'
) {
  const button = container.querySelector('[data-series-button]')
  const menu = container.querySelector('[data-series-options]')
  const selection = container.querySelector('.series-label')
  const items = container.querySelectorAll('[data-value]')

  let selected = initial

  function updateSelection(value) {
    selected = value
    selection.textContent = labels[value] ?? value
    menu.classList.add('hidden')
    container.classList.remove('open')
    button.setAttribute('aria-expanded', 'false')
    const label = descriptions[selected] ?? selected
    if (labelElement) labelElement.textContent = label

    items.forEach((item) => {
      if (item.dataset.value === selected) {
        item.classList.add('hidden')
      } else {
        item.classList.remove('hidden')
      }
    })
  }

  // Open/close menu
  button.addEventListener('click', () => {
    const isOpen = menu.classList.contains('hidden') === false
    menu.classList.toggle('hidden')
    container.classList.toggle('open')
    button.setAttribute('aria-expanded', String(!isOpen))
  })

  function closeDropdown() {
    menu.classList.add('hidden')
    container.classList.remove('open')
    button.setAttribute('aria-expanded', 'false')
  }

  // Click outside closes
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      closeDropdown()
    }
  })

  // Handle selection click
  items.forEach((item) => {
    item.addEventListener('click', () => {
      const value = item.dataset.value
      if (value !== selected) {
        updateSelection(value)
        window.dispatchEvent(new CustomEvent(eventName, { detail: selected }))
      } else {
        menu.classList.add('hidden')
      }
    })
  })

  const closeBtn = menu.querySelector('[data-dropdown-close]')
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDropdown)
  }

  // Initial trigger
  updateSelection(selected)
}

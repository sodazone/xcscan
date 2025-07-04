const descriptions = {
  volume: 'Total volume in USD',
  count: 'Number of transfers',
  flow: 'Inflow, outflow and netflow in USD',
  share: 'Volume share over total ecosystem',
  asset: 'Total volume in asset amount',
}

const labels = {
  volume: 'Volume',
  count: 'Transfers',
  flow: 'Netflow',
  share: 'Share',
  asset: 'Amount',
}

export function setupDropdownSelector(
  container,
  labelElement,
  eventName,
  initial = 'volume'
) {
  const button = container.querySelector('#series-button')
  const menu = container.querySelector('#series-options')
  const selection = container.querySelector('.series-label')
  const items = container.querySelectorAll('[data-value]')

  let selected = initial

  function updateSelection(value) {
    selected = value
    selection.textContent = labels[value] ?? value
    menu.classList.add('hidden')
    button.setAttribute('aria-expanded', 'false')
    window.dispatchEvent(new CustomEvent(eventName, { detail: selected }))
    const label = descriptions[selected] ?? selected
    if (labelElement) labelElement.textContent = label

    items.forEach((item) => {
      if (item.dataset.value === selected) {
        item.classList.add('selected')
      } else {
        item.classList.remove('selected')
      }
    })
  }

  // Open/close menu
  button.addEventListener('click', () => {
    const isOpen = menu.classList.contains('hidden') === false
    menu.classList.toggle('hidden')
    button.setAttribute('aria-expanded', String(!isOpen))
  })

  // Click outside closes
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      menu.classList.add('hidden')
      button.setAttribute('aria-expanded', 'false')
    }
  })

  // Handle selection click
  items.forEach((item) => {
    item.addEventListener('click', () => {
      const value = item.dataset.value
      if (value !== selected) {
        updateSelection(value)
      } else {
        menu.classList.add('hidden')
      }
    })
  })

  // Initial trigger
  updateSelection(selected)
}

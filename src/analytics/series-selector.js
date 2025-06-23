export function setupSeriesSelector(element, initial = 'volume') {
  let selected = initial

  function update() {
    window.dispatchEvent(
      new CustomEvent('seriesTypeChanged', { detail: selected })
    )

    for (const child of element.children) {
      if (child.dataset.value === selected) {
        child.className = 'bg-cyan-800/40 rounded text-cyan-200 p-1'
      } else {
        child.className =
          'text-cyan-200/40 p-1 cursor-pointer hover:text-cyan-200'
      }
    }

    const label = selected === 'volume' ? 'Volume' : 'Transfers'
    const currentTypeSpan = document.querySelector('.current-type')
    if (currentTypeSpan) currentTypeSpan.textContent = label
  }

  function handleSeriesClick(e) {
    const selection = e.currentTarget.dataset.value
    if (selection !== selected) {
      selected = e.currentTarget.dataset.value
      update()
    }
  }

  for (const child of element.children) {
    child.onclick = handleSeriesClick
  }

  update()
}

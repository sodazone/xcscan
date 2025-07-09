import { TIME_PERIODS } from './api.js'

export function setupTimeSelector(element, initial = 'monthly') {
  let selected = initial

  function update() {
    window.dispatchEvent(new CustomEvent('timeChanged', { detail: selected }))

    for (const child of element.children) {
      if (child.dataset.value === selected) {
        child.className = 'text-white/80 p-1'
      } else {
        child.className = 'text-white/40 p-1 cursor-pointer hover:text-white'
      }
    }

    for (const element of document.querySelectorAll('.current-period')) {
      element.innerHTML = TIME_PERIODS[selected].label
    }
  }

  function handleTimeClick(e) {
    const selection = e.currentTarget.dataset.value
    if (selection !== selected) {
      selected = e.currentTarget.dataset.value
      update()
    }
  }

  for (const child of element.children) {
    child.onclick = handleTimeClick
  }

  update()
}

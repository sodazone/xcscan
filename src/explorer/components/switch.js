export function setupSwitches() {
  document.querySelectorAll('[data-switch]').forEach((el) => {
    el.style.display = 'inline-block'
    el.style.position = 'relative'
    el.style.width = '1.75rem'
    el.style.height = '1rem'
    el.style.background = 'rgba(255,255,255,0.1)'
    el.style.borderRadius = '3px'
    el.style.cursor = 'pointer'
    el.style.transition = 'background 0.2s'

    const knob = document.createElement('div')
    knob.style.position = 'absolute'
    knob.style.top = '2px'
    knob.style.left = '2px'
    knob.style.width = '0.75rem'
    knob.style.height = '0.75rem'
    knob.style.borderRadius = '2px'
    knob.style.background = '#FFFFFF'
    knob.style.transition = 'transform 0.2s'
    el.appendChild(knob)

    let on = false

    const update = () => {
      el.style.background = on ? '#00c951' : 'rgba(255,255,255,0.1)'
      knob.style.transform = on ? 'translateX(0.75rem)' : 'translateX(0)'
    }

    el.addEventListener('click', () => {
      on = !on
      update()
      el.dispatchEvent(new CustomEvent('switch-change', { detail: { on } }))
    })

    update()
  })
}

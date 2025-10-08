export function createStopDetails(title, detailsContent) {
  if (!detailsContent) {
    const empty = document.createElement('div')
    empty.classList = 'hidden'
    return empty
  }

  const wrapper = document.createElement('div')
  wrapper.className = 'dropdown'

  const button = document.createElement('button')
  button.className = 'dropdown-toggle group my-2 items-center'
  button.style = 'padding: 0;'
  button.setAttribute('aria-expanded', 'false')

  // Create the inner flex container for button text
  const innerDiv = document.createElement('div')
  innerDiv.className = 'flex items-start gap-2'

  // Text span
  const btnText = document.createElement('div')
  btnText.innerHTML = `
    <div class="flex space-x-2 items-center group-hover:text-white/60">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
      <span class="text-white/60 group-hover:text-white/80">${title}</span>
    </div>`
  innerDiv.appendChild(btnText)

  button.appendChild(innerDiv)

  // Chevron SVG element
  const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  chevron.setAttribute('viewBox', '0 0 24 24')
  chevron.setAttribute('fill', 'none')
  chevron.setAttribute('stroke', 'currentColor')
  chevron.setAttribute('stroke-width', '2')
  chevron.setAttribute('stroke-linecap', 'round')
  chevron.setAttribute('stroke-linejoin', 'round')
  chevron.classList.add('dropdown-chevron')

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M19 9l-7 7-7-7')
  chevron.appendChild(path)

  button.appendChild(chevron)

  button.addEventListener('click', () => {
    const isVisible = detailsContent.classList.toggle('hidden') === false
    button.setAttribute('aria-expanded', isVisible.toString())
    wrapper.classList.toggle('open', isVisible)
  })

  wrapper.appendChild(button)
  wrapper.appendChild(detailsContent)

  return wrapper
}

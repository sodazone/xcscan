export function createJsonViewer(jsonObj, options = {}) {
  const defaultDepth = options.depth ?? 0

  function createNode(key, value, level = 0) {
    const node = document.createElement('div')
    node.classList.add('json-node')

    const keySpan = document.createElement('span')
    keySpan.classList.add('json-key')
    if (key !== null) {
      keySpan.textContent = `${key}: `
    }

    if (value && typeof value === 'object') {
      // Collapsible control
      const collapsible = document.createElement('span')
      collapsible.classList.add('json-collapsible')
      collapsible.textContent = Array.isArray(value) ? '[...]' : '{...}'
      collapsible.style.cursor = 'pointer'
      collapsible.style.userSelect = 'none'

      // Child container
      const childrenContainer = document.createElement('div')
      childrenContainer.classList.add('json-children')
      childrenContainer.style.marginLeft = '1.2em'

      // Recursively add children
      for (const [k, v] of Array.isArray(value)
        ? value.entries()
        : Object.entries(value)) {
        childrenContainer.appendChild(createNode(k, v, level + 1))
      }

      // Determine initial state
      const shouldExpand = level < defaultDepth
      childrenContainer.style.display = shouldExpand ? 'block' : 'none'
      collapsible.textContent = shouldExpand
        ? Array.isArray(value)
          ? '[-]'
          : '{-}'
        : Array.isArray(value)
          ? '[...]'
          : '{...}'

      // Click toggle
      collapsible.addEventListener('click', () => {
        const isVisible = childrenContainer.style.display === 'block'
        childrenContainer.style.display = isVisible ? 'none' : 'block'
        collapsible.textContent = !isVisible
          ? Array.isArray(value)
            ? '[-]'
            : '{-}'
          : Array.isArray(value)
            ? '[...]'
            : '{...}'
      })

      node.appendChild(keySpan)
      node.appendChild(collapsible)
      node.appendChild(childrenContainer)
    } else {
      // Primitive
      const valSpan = document.createElement('span')
      valSpan.classList.add('json-value')

      if (typeof value === 'string') {
        valSpan.textContent = `"${value}"`
        valSpan.style.color = '#6A9955'
      } else if (typeof value === 'number') {
        valSpan.textContent = value
        valSpan.style.color = '#569CD6'
      } else if (typeof value === 'boolean') {
        valSpan.textContent = value
        valSpan.style.color = '#D16969'
      } else if (value === null) {
        valSpan.textContent = 'null'
        valSpan.style.color = '#808080'
      } else {
        valSpan.textContent = String(value)
      }

      node.appendChild(keySpan)
      node.appendChild(valSpan)
    }

    return node
  }

  // Container styling
  const container = document.createElement('div')
  container.classList.add('json-viewer')
  container.style.fontFamily = 'monospace'
  container.style.fontSize = '14px'
  container.style.color = '#d4d4d4'
  container.style.backgroundColor = '#1e1e1e'
  container.style.padding = '10px'
  container.style.borderRadius = '6px'
  container.style.maxHeight = '400px'
  container.style.overflow = 'auto'

  // Root rendering
  if (typeof jsonObj === 'object' && jsonObj !== null) {
    for (const [k, v] of Object.entries(jsonObj)) {
      container.appendChild(createNode(k, v, 0))
    }
  } else {
    container.appendChild(createNode(null, jsonObj, 0))
  }

  return container
}

function buttonHTML(open) {
  return `<div class="flex space-x-2 items-center">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
  <path stroke-linecap="round" stroke-linejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
</svg>
    Instructions  <svg class="${open ? 'rotate-180' : ''} w-4 h-4 text-white/40 ml-2" fill="none" stroke="currentColor" stroke-width="2"
                viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" />
              </svg>
</div>
`
}

export function createXcmProgramViewer(entry) {
  const instructionsContainerId = 'instructions-json-viewer'

  const instructionsToggleBtn = document.createElement('button')
  instructionsToggleBtn.innerHTML = buttonHTML(false)
  instructionsToggleBtn.className =
    'json-toggle-btn flex w-fit justify-between items-center text-sm text-white/70 hover:text-white'
  instructionsToggleBtn.style.cursor = 'pointer'
  instructionsToggleBtn.style.userSelect = 'none'

  const instructionsContainer = document.createElement('div')
  instructionsContainer.id = instructionsContainerId
  instructionsContainer.style.display = 'none'
  instructionsContainer.style.marginTop = '0.5em'

  const viewer = createJsonViewer(entry.instructions, { depth: 2 })
  instructionsContainer.appendChild(viewer)

  instructionsToggleBtn.addEventListener('click', () => {
    if (instructionsContainer.style.display === 'none') {
      instructionsContainer.style.display = 'block'
      instructionsToggleBtn.innerHTML = buttonHTML(true)
    } else {
      instructionsContainer.style.display = 'none'
      instructionsToggleBtn.innerHTML = buttonHTML(false)
    }
  })

  const programViewer = document.createElement('div')
  programViewer.className = 'flex flex-col gap-y-2 my-8'
  programViewer.innerHTML = '<h2>XCM Program</h2>'
  programViewer.appendChild(instructionsToggleBtn)
  programViewer.appendChild(instructionsContainer)

  return programViewer
}

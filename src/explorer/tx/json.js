function createLucideIcon(name, size = 16) {
  const icons = {
    ChevronsDownUp: `<polyline points="7 3 12 8 17 3"></polyline><polyline points="7 21 12 16 17 21"></polyline>`,
    ChevronsUpDown: `<polyline points="7 7 12 2 17 7"></polyline><polyline points="7 17 12 22 17 17"></polyline>`,
    Copy: `<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>`,
    Check: `<polyline points="20 6 9 17 4 12"></polyline>`,
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('width', size)
  svg.setAttribute('height', size)
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.innerHTML = icons[name] || ''
  return svg
}

export function createJsonViewer(jsonObj, options = {}) {
  const defaultDepth = options.depth ?? 0

  function createNode(key, value, level = 0) {
    const node = document.createElement('div')
    node.className = 'json-node'
    node.dataset.level = level

    const line = document.createElement('div')
    line.className = 'json-line'
    line.tabIndex = 0

    const isObject = value && typeof value === 'object'
    if (isObject) {
      const chevron = document.createElement('span')
      chevron.className = 'json-chevron'
      line.appendChild(chevron)
      line.classList.add('clickable')
    }

    if (key !== null) {
      const keySpan = document.createElement('span')
      keySpan.className = 'json-key'
      keySpan.textContent = `${key}: `
      line.appendChild(keySpan)
    }

    if (isObject) {
      const isArray = Array.isArray(value)

      const openBracket = document.createElement('span')
      openBracket.className = 'json-bracket'
      openBracket.textContent = isArray ? '[' : '{'
      line.appendChild(openBracket)

      const previewCount = isArray ? value.length : Object.keys(value).length
      const preview = document.createElement('span')
      preview.className = 'json-preview collapsed-only'
      preview.textContent = `(${previewCount})`

      const closeBracket = document.createElement('span')
      closeBracket.className = 'json-bracket collapsed-only'
      closeBracket.textContent = isArray ? ']' : '}'

      line.append(preview, closeBracket)
      node.appendChild(line)

      const childrenContainer = document.createElement('div')
      childrenContainer.className = 'json-children'

      for (const [childKey, childValue] of isArray
        ? value.entries()
        : Object.entries(value)) {
        childrenContainer.appendChild(
          createNode(childKey, childValue, level + 1)
        )
      }

      const closingLine = document.createElement('div')
      closingLine.className = 'json-closing'
      closingLine.textContent = isArray ? ']' : '}'
      childrenContainer.appendChild(closingLine)

      node.appendChild(childrenContainer)
      node.classList.toggle('collapsed', level >= defaultDepth)
    } else {
      const valSpan = document.createElement('span')
      valSpan.className = 'json-value'

      switch (typeof value) {
        case 'string':
          valSpan.textContent = `"${value}"`
          valSpan.dataset.type = 'string'
          break
        case 'number':
          valSpan.textContent = value
          valSpan.dataset.type = 'number'
          break
        case 'boolean':
          valSpan.textContent = value
          valSpan.dataset.type = 'boolean'
          break
        default:
          valSpan.textContent = value === null ? 'null' : String(value)
          valSpan.dataset.type = value === null ? 'null' : 'unknown'
      }
      line.appendChild(valSpan)
      node.appendChild(line)
    }

    return node
  }

  const container = document.createElement('div')
  container.className = 'json-viewer'

  const toolbar = document.createElement('div')
  toolbar.className = 'json-toolbar'

  const expandBtn = document.createElement('button')
  expandBtn.type = 'button'
  expandBtn.className = 'json-btn'
  expandBtn.title = 'Expand All'
  expandBtn.appendChild(createLucideIcon('ChevronsUpDown'))

  const collapseBtn = document.createElement('button')
  collapseBtn.type = 'button'
  collapseBtn.className = 'json-btn'
  collapseBtn.title = 'Collapse All'
  collapseBtn.appendChild(createLucideIcon('ChevronsDownUp'))

  const copyBtn = document.createElement('button')
  copyBtn.type = 'button'
  copyBtn.className = 'json-btn'
  copyBtn.title = 'Copy JSON'

  const copyIcon = createLucideIcon('Copy')
  copyIcon.classList.add('copy-icon')
  const checkIcon = createLucideIcon('Check')
  checkIcon.classList.add('check-icon')
  checkIcon.style.display = 'none'

  copyBtn.append(copyIcon, checkIcon)

  toolbar.append(expandBtn, collapseBtn, copyBtn)
  container.appendChild(toolbar)

  const content = document.createElement('div')
  content.className = 'json-content'

  if (typeof jsonObj === 'object' && jsonObj !== null) {
    for (const [key, value] of Object.entries(jsonObj)) {
      content.appendChild(createNode(key, value, 0))
    }
  } else {
    content.appendChild(createNode(null, jsonObj, 0))
  }
  container.appendChild(content)

  container.addEventListener('click', (e) => {
    const line = e.target.closest('.json-line')
    if (!line) return
    const parentNode = line.parentElement
    if (!parentNode?.classList.contains('json-node')) return
    if (!line.querySelector('.json-chevron')) return
    parentNode.classList.toggle('collapsed')
  })

  expandBtn.addEventListener('click', () => {
    container
      .querySelectorAll('.json-node.collapsed')
      .forEach((node) => node.classList.remove('collapsed'))
  })

  collapseBtn.addEventListener('click', () => {
    container
      .querySelectorAll('.json-node:not(.collapsed)')
      .forEach((node) => node.classList.add('collapsed'))
  })

  copyBtn.addEventListener('click', async () => {
    try {
      const jsonString = JSON.stringify(jsonObj, null, 2)
      await navigator.clipboard.writeText(jsonString)
      copyIcon.style.display = 'none'
      checkIcon.style.display = 'inline'
      setTimeout(() => {
        checkIcon.style.display = 'none'
        copyIcon.style.display = 'inline'
      }, 1200)
    } catch (err) {
      console.error('Failed to copy JSON', err)
    }
  })

  return container
}

export function createCollapsibleJsonViewer(jsonObj, options = {}) {
  const wrapper = document.createElement('div')
  wrapper.className = 'json-wrapper'

  const toggleBtn = document.createElement('button')
  toggleBtn.type = 'button'
  toggleBtn.className = 'json-wrapper-toggle'
  toggleBtn.innerHTML = `
  <div class="flex items-center gap-2 text-sm">
    <span>${options.label ?? 'JSON'}</span>
    <svg class="toggle-chevron transition-transform text-white/40 size-4" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  </div>
`

  function toggle() {
    const hidden = viewer.style.display === 'none'
    viewer.style.display = hidden ? 'block' : 'none'

    const chevron = toggleBtn.querySelector('.toggle-chevron')
    if (hidden) {
      chevron.classList.add('rotate-180')
    } else {
      chevron.classList.remove('rotate-180')
    }
  }

  const viewer = createJsonViewer(jsonObj, options)
  viewer.style.display = 'none'

  toggleBtn.addEventListener('click', toggle)

  if (options.isOpen) {
    toggle()
  }

  wrapper.append(toggleBtn, viewer)
  return wrapper
}

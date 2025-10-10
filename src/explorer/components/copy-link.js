const clipboardSVG = `
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
</svg>
`

const okSVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4">
    <path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd" />
  </svg>
`

export function createCopyLink({ text, display = null, url = null }) {
  const container = document.createElement('div')

  if (
    (text == null || text.trim() == '') &&
    (display == null || display.trim() == '')
  ) {
    return container
  }

  container.className =
    'flex w-fit items-center space-x-1 group text-sm text-white/80'

  let isExtLink = false
  let copyText
  if (url) {
    copyText = document.createElement('a')
    copyText.href = url
    if (url.startsWith('http')) {
      copyText.target = '_blank'
      copyText.rel = 'noopener noreferrer'
      isExtLink = true
    }
  } else {
    copyText = document.createElement('span')
  }
  copyText.className =
    'font-mono truncate max-w-[10rem] group-hover:underline group-hover:text-white transition-colors'

  if (display != null && display.startsWith('<')) {
    copyText.innerHTML = display
  } else {
    copyText.textContent = display ?? text
  }

  const copyBtn = document.createElement('button')
  copyBtn.className =
    'cursor-pointer md:opacity-0 md:group-hover:opacity-100 md:transition-opacity md:duration-200 text-[#777777] hover:text-white'
  copyBtn.title = 'Copy'
  copyBtn.type = 'button'
  copyBtn.innerHTML = clipboardSVG
  copyBtn.setAttribute('data-copy-data', text)
  copyBtn.setAttribute('aria-label', 'Copy to clipboard')

  container.appendChild(copyText)
  if (isExtLink) {
    const extArrow = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    )
    extArrow.setAttribute('class', 'size-4 text-white/20')
    extArrow.setAttribute('title', 'External Link')
    extArrow.setAttribute('viewBox', '0 0 16 16')
    extArrow.setAttribute('fill', 'currentColor')
    extArrow.innerHTML = `
  <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z" />
  <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z" />
  `
    container.appendChild(extArrow)
  }
  container.appendChild(copyBtn)

  return container
}

export function createCopyLinkHTML(opts) {
  return createCopyLink(opts).outerHTML
}

export function installCopyEventListener() {
  document.body.addEventListener('click', async (event) => {
    const btn = event.target.closest('button[data-copy-data]')
    if (!btn) return

    const text = btn.getAttribute('data-copy-data')
    if (!text) return

    try {
      event.preventDefault()

      await navigator.clipboard.writeText(text)
      const original = btn.innerHTML
      btn.innerHTML = okSVG
      setTimeout(() => {
        btn.innerHTML = original
      }, 1000)
    } catch (err) {
      console.error('Copy failed', err)
    }
  })
}

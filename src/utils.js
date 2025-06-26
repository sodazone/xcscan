export function debounce(func, delay = 300) {
  let timer
  let lastArgs
  let lastResolve
  let lastReject

  return (...args) => {
    lastArgs = args

    return new Promise((resolve, reject) => {
      clearTimeout(timer)

      lastResolve = resolve
      lastReject = reject

      timer = setTimeout(() => {
        Promise.resolve(func(...lastArgs))
          .then(lastResolve)
          .catch(lastReject)
      }, delay)
    })
  }
}

export function htmlToElement(html) {
  const template = document.createElement('template')
  template.innerHTML = html.trim()
  return template.content.firstChild
}

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

export function withRetry(fn, defaultOptions = {}) {
  return async function retryWrapper(customOptions = {}) {
    const {
      retries = 5,
      delay = 2000,
      exponential = true,
    } = { ...defaultOptions, ...customOptions }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn()
      } catch (err) {
        if (attempt === retries) throw err

        if (!navigator.onLine) {
          console.warn('Offline detected. Waiting for reconnection...')
          await new Promise((resolve) =>
            window.addEventListener('online', resolve, { once: true })
          )
          console.info('Back online. Retrying now...')
          continue
        }

        const retryDelay = exponential ? delay * Math.pow(2, attempt) : delay

        console.warn(
          `Retrying (${attempt + 1}/${retries}) after ${retryDelay}ms...`,
          err.message
        )

        await new Promise((r) => setTimeout(r, retryDelay))
      }
    }
  }
}

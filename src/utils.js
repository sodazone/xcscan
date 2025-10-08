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

export function withRetry(fetchFn, defaultOptions = {}) {
  return async function retryWrapper(customOptions = {}) {
    const {
      retries = 5,
      delay = 2000,
      exponential = true,
    } = { ...defaultOptions, ...customOptions }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetchFn()

        // Honor HTTP 429 (Too Many Requests)
        if (res.status === 429) {
          if (attempt === retries) throw new Error('Too many retries (429)')

          const retryAfterHeader = res.headers.get('Retry-After')
          let retryDelay

          if (retryAfterHeader) {
            // Retry-After can be either a number (seconds) or a date
            const parsed = isNaN(retryAfterHeader)
              ? Math.max(0, new Date(retryAfterHeader).getTime() - Date.now())
              : parseInt(retryAfterHeader, 10) * 1000
            retryDelay = parsed || delay
            console.warn(`Received 429. Honoring Retry-After: ${retryDelay}ms`)
          } else {
            retryDelay = exponential ? delay * Math.pow(2, attempt) : delay
            console.warn(
              `Received 429 (no Retry-After header). Backing off ${retryDelay}ms`
            )
          }

          await new Promise((r) => setTimeout(r, retryDelay))
          continue
        }

        // Retry on transient 5xx errors
        if (res.status >= 500 && res.status < 600) {
          if (attempt === retries)
            throw new Error(`Server error: ${res.status}`)
          const retryDelay = exponential ? delay * Math.pow(2, attempt) : delay
          console.warn(
            `Retrying (${attempt + 1}/${retries}) after ${retryDelay}ms due to ${res.status}`
          )
          await new Promise((r) => setTimeout(r, retryDelay))
          continue
        }

        // Ok
        return res
      } catch (err) {
        // Handle network-level errors
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
          `Network error. Retrying (${attempt + 1}/${retries}) after ${retryDelay}ms...`,
          err.message
        )
        await new Promise((r) => setTimeout(r, retryDelay))
      }
    }
  }
}

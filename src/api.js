import { apiKey } from './env'

const headers = Object.assign(
  {
    'Content-Type': 'application/json',
  },
  apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
)

export async function fetchWithRetry(
  queryUrl,
  body,
  retries = 5,
  delay = 2000
) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await _fetch(queryUrl, body)
    } catch (err) {
      if (i === retries) throw err
      if (!navigator.onLine) {
        console.warn('Offline detected. Waiting for reconnection...')
        await new Promise((resolve) =>
          window.addEventListener('online', resolve, { once: true })
        )
        console.info('Back online. Retrying now...')
        continue
      }
      console.warn(`Retrying fetch (${i + 1}/${retries})...`, err.message)
      await new Promise((r) => setTimeout(r, delay * (i + 1)))
    }
  }
}

async function _fetch(queryUrl, body) {
  const response = await fetch(queryUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Response status: ${response.status} ${text}`)
  }

  return await response.json()
}

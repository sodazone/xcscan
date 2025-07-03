import { apiKey } from './env'
import { withRetry } from './utils'

const headers = Object.assign(
  {
    'Content-Type': 'application/json',
  },
  apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
)

export async function fetchWithRetry(queryUrl, body) {
  return withRetry(() => _fetch(queryUrl, body))()
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

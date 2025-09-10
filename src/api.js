import { apiKey } from './env'
import { withRetry } from './utils'

const headers = Object.assign(
  {
    'Content-Type': 'application/json',
  },
  apiKey ? { Authorization: `Bearer ${apiKey}` } : {}
)

export async function postWithRetry(url, body) {
  return withRetry(() =>
    _fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
  )()
}

export async function getWithRetry(url) {
  return withRetry(() =>
    _fetch(url, {
      method: 'GET',
      headers,
    })
  )()
}

async function _fetch(url, params) {
  const response = await fetch(url, params)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Response status: ${response.status} ${text}`)
  }

  return await response.json()
}

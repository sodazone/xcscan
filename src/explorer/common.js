import '../style.css'

import {
  loadExtraInfos,
  resolveNetworkIcon,
  resolveNetworkName,
} from '../extras.js'
import { humanizeNumber } from '../formats.js'

let loaded = false

export async function loadResources() {
  return loaded
    ? Promise.resolve()
    : loadExtraInfos().then(() => {
        loaded = true
      })
}

export function shortHash(h) {
  return h.length > 12 ? `${h.slice(0, 6)}…${h.slice(-6)}` : h
}

function hexToUint8Array(hexString) {
  let hex = hexString
  if (hex.startsWith('0x')) {
    hex = hex.slice(2)
  }
  if (hex.length % 2 !== 0) {
    hex = `0${hex}`
  }
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = Number.parseInt(hex.substr(i * 2, 2), 16)
  }
  return arr
}

function getParaIdFromBytes(data) {
  if (data.length < 8) {
    throw new Error('Data too short, need at least 8 bytes')
  }
  return (data[4] + (data[5] << 8) + (data[6] << 16) + (data[7] << 24)) >>> 0
}

export function formatNetworkWithIconHTML(networkId) {
  const name = resolveNetworkName(networkId)
  const iconUrl = resolveNetworkIcon(networkId)

  if (iconUrl == null || iconUrl == null) {
    return `<div>${name ?? networkId}</div>`
  }

  return `
    <div class="flex items-center space-x-1">
      <img src="${iconUrl}" alt="${name}" class="size-5 rounded-full" />
      <span>${name ?? networkId}</span>
    </div>
  `
}

function resolvePara(address) {
  const paraId = getParaIdFromBytes(hexToUint8Array(address))
  return resolveNetworkName(`urn:ocn:polkadot:${paraId}`) ?? paraId
}

export function decodeWellKnownAddressHTML(address) {
  const para = '0x70617261'
  const sibl = '0x7369626c'

  if (address.startsWith(para) || address.startsWith(sibl)) {
    return `<div class="flex space-x-1 items-center" title="Sovereign Account">
<span>${resolvePara(address)}</span>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4 text-white/40">
  <path fill-rule="evenodd" d="M7.605 2.112a.75.75 0 0 1 .79 0l5.25 3.25A.75.75 0 0 1 13 6.707V12.5h.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H3V6.707a.75.75 0 0 1-.645-1.345l5.25-3.25ZM4.5 8.75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3ZM8 8a.75.75 0 0 0-.75.75v3a.75.75 0 0 0 1.5 0v-3A.75.75 0 0 0 8 8Zm2 .75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3ZM8 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
</svg>
</div>`
  }

  return null
}

export function shortenAddress(address) {
  if (!address || typeof address !== 'string') return ''

  if (address.startsWith('0x') && address.length === 42) {
    return `${address.slice(0, 6)}…${address.slice(-4)}`
  }

  if (address.length >= 40) {
    return `${address.slice(0, 8)}…${address.slice(-8)}`
  }

  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function formatAction(entry) {
  if (entry.type === 'transact' && entry.transactCalls?.length) {
    const call = entry.transactCalls[0]
    return `${prettify(call.module)} · ${prettify(call.method)}`
  }

  return prettify(entry.type)
}

export function prettify(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to space
    .replace(/[_\-]/g, ' ') // snake_case or kebab-case to space
}

function safeNumber(num) {
  if (num == null) return null
  const n = Number(num)
  if (isNaN(n)) return null
  return n
}

function safeNormalizeAmount(amount, decimals) {
  const amt = safeNumber(amount)
  const dec = safeNumber(decimals)
  if (amount == null || decimals == null) return null
  return amt / 10 ** dec
}

export function formatAssetAmount(asset) {
  if (asset.decimals == null) {
    return ''
  }

  let amount = ''
  const normalizedAmount = safeNormalizeAmount(asset.amount, asset.decimals)
  const usdNumber = safeNumber(asset.usd)

  if (normalizedAmount == null) {
    return ''
  }

  amount += `<div class="flex space-x-1"><span>${humanizeNumber(normalizedAmount)}</span><span class="text-white/60">${asset.symbol}</span></div>`
  if (usdNumber != null) {
    amount += `<div class="flex text-xs text-white/60">($${humanizeNumber(asset.usd)})</div>`
  }
  return `<div class="flex flex-wrap items-center space-x-2">${amount}</div>`
}

export const selectableActions = [
  {
    label: 'Transfer',
    value: 'transfer',
  },
  {
    label: 'Transact',
    value: 'transact',
  },
  {
    label: 'Query',
    value: 'query',
  },
]

export function actionsToQueryValues(actions) {
  const expanded = (Array.isArray(actions) ? actions : [actions]).flatMap(
    (action) => {
      if (action === 'transfer') {
        return ['transfer', 'teleport']
      }
      if (action === 'query') {
        return ['queryResponse']
      }
      return [action]
    }
  )

  return expanded
}

export const selectableStatus = ['sent', 'received', 'failed']
const statusLabels = {
  sent: 'In Progress',
  received: 'Completed',
  success: 'Completed',
  fail: 'Failed',
  failed: 'Failed',
  timeout: 'Timeout',
}

export function getStatusLabel(status) {
  return statusLabels[status.toLowerCase()] ?? 'unknown'
}

export function asClassName(label) {
  return label.replace(' ', '_').toLowerCase()
}

export function makeGuardedClickHandler(button, update) {
  let loading = false
  button.onclick = () => {
    if (button.disabled || loading) return

    loading = true
    button.classList.add('loading')

    update().finally(() => {
      loading = false
      button.classList.remove('loading')
    })
  }
}

export function enforceNumericInput(inputEl, { allowDecimal = false } = {}) {
  inputEl.addEventListener('input', () => {
    let cleaned = inputEl.value

    if (allowDecimal) {
      // Remove invalid characters and allow only one decimal point
      cleaned = cleaned
        .replace(/[^\d.]/g, '') // remove non-numeric/non-dot
        .replace(/^\.*/, '') // don't allow starting with a dot
        .replace(/(\..*)\./g, '$1') // only one decimal allowed
    } else {
      cleaned = cleaned.replace(/[^\d]/g, '') // remove everything except digits
    }

    if (inputEl.value !== cleaned) {
      const cursorPos = inputEl.selectionStart
      inputEl.value = cleaned
      // Try to restore cursor position
      inputEl.setSelectionRange(cursorPos - 1, cursorPos - 1)
    }
  })
  return inputEl
}

export function pad(num) {
  return String(num).padStart(2, '0')
}

export function formatLocalTimestamp(timestamp) {
  const date = new Date(timestamp)

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')

  const utcYyyy = date.getUTCFullYear()
  const utcMm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const utcDd = String(date.getUTCDate()).padStart(2, '0')
  const utcHh = String(date.getUTCHours()).padStart(2, '0')
  const utcMi = String(date.getUTCMinutes()).padStart(2, '0')
  const utcSs = String(date.getUTCSeconds()).padStart(2, '0')

  const utcTooltip = `UTC ${utcHh}:${utcMi}:${utcSs} · ${utcYyyy}-${utcMm}-${utcDd}`

  return `
    <div class="flex flex-col space-y-1 leading-tight text-sm" title="${utcTooltip}">
      <span class="text-white">${hh}:${mi}:${ss}</span>
      <span class="text-white/60">${yyyy}-${mm}-${dd}</span>
    </div>
  `
}

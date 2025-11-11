import '../style.css'

import {
  loadExtraInfos,
  resolveAssetIcon,
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

export function formatNetworkWithIconHTML(networkId) {
  const name = resolveNetworkName(networkId)
  const iconUrl = resolveNetworkIcon(networkId)

  if (iconUrl == null || iconUrl == null) {
    return `<div>${name ?? networkId}</div>`
  }

  return `
    <div class="flex items-center gap-2">
      <img src="${iconUrl}" alt="${name}" class="size-6 rounded-full bg-black/20 border-black/40 border" />
      <span>${name ?? networkId}</span>
    </div>
  `
}

export function formatAction(entry) {
  if (entry.type === 'transact' && entry.transactCalls?.length) {
    const call = entry.transactCalls[0]
    return call.module == null
      ? prettify(entry.type)
      : `${prettify(call.module)} · ${prettify(call.method)}`
  }

  return prettify(entry.type)
}

export function prettify(str) {
  if (str == null) {
    return str
  }
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

export function formatAssetAmount(
  asset,
  showUsd = true,
  classes = 'flex flex-wrap items-center space-x-2'
) {
  if (asset == null || asset.decimals == null) {
    return ''
  }

  let amount = ''
  const normalizedAmount = safeNormalizeAmount(asset.amount, asset.decimals)
  const usdNumber = safeNumber(asset.usd)

  if (normalizedAmount == null) {
    return ''
  }

  amount += `<div class="flex space-x-1"><span>${humanizeNumber(normalizedAmount)}</span><span class="text-white/60">${asset.symbol ?? 'UNIT'}</span></div>`
  if (showUsd && usdNumber != null) {
    amount += `<div class="flex text-xs text-white/60">($${humanizeNumber(asset.usd)})</div>`
  }
  return `<div class="${classes}">${amount}</div>`
}

export function assetIconHTML({ asset }, usePlaceholder = false) {
  const sources = resolveAssetIcon(asset)
  if (sources) {
    const { assetIconUrl, chainIconUrl } = sources
    if (assetIconUrl) {
      return `
      <div class="relative inline-block w-6 h-6">
        <img class="w-full h-full rounded-full object-cover bg-black/20 border-black/40 border" src="${assetIconUrl}" alt="" />
        ${
          chainIconUrl
            ? `<img
              class="absolute -top-0.5 -left-1.5 w-4 h-4 rounded-full border border-white bg-white"
              src="${chainIconUrl}"
              alt=""
            />`
            : ''
        }
      </div>
    `
    }
  }
  return usePlaceholder
    ? `<span class="flex items-center justify-center text-sm font-bold text-cyan-100/30 size-6 rounded-full border-2 border-cyan-100/30">?</span>`
    : ''
}

export const selectableProtocols = [
  {
    label: 'XCM',
    value: 'xcm',
  },
  {
    label: 'Wormhole',
    value: 'wormhole',
  },
  {
    label: 'Snowbridge',
    value: 'snowbridge',
  },
]

export function protocolsToQueryValues(protocols) {
  const expanded = (Array.isArray(protocols) ? protocols : [protocols]).flatMap(
    (protocol) => {
      if (protocol === 'wormhole') {
        return ['wh', 'wh_portal', 'wh_relayer']
      }
      return [protocol]
    }
  )

  return expanded
}

export const selectableActions = [
  {
    label: 'Transfer',
    value: 'transfer',
  },
  {
    label: 'Swap',
    value: 'swap',
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
        return ['transfer', 'teleport', 'swap']
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
  pending: 'In Progress',
  received: 'Completed',
  success: 'Completed',
  completed: 'Completed',
  confirmed: 'Completed',
  fail: 'Failed',
  failed: 'Failed',
  timeout: 'Timeout',
}

export function formatStatusIconHTML(status) {
  const label = getStatusLabel(status)
  const cls = asClassName(label)
  return `<img class="${cls} size-3" src="/icons/${cls}.svg" alt="${cls}" title="${label}" />`
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

export function formatLocalTimestamp(timestamp, style = 'col') {
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
  const classes =
    style == 'col'
      ? 'flex-col space-y-1 leading-tight text-sm'
      : 'space-x-2 text-xs'

  return `
    <div class="flex ${classes}" title="${utcTooltip}">
      <span class="text-white">${hh}:${mi}:${ss}</span>
      <span class="text-white/60">${yyyy}-${mm}-${dd}</span>
    </div>
  `
}

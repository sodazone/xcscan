let cachedLocale = null

export function getSafeLocale() {
  if (cachedLocale) {
    return cachedLocale
  }

  const rawLocale = navigator.language || 'en-US'
  cachedLocale = sanitizeLocale(rawLocale)
  return cachedLocale
}

function sanitizeLocale(locale) {
  const safe = locale
    .split('.')[0] // remove encoding like UTF-8
    .split('@')[0] // remove modifiers like @posix
    .replace('_', '-') // normalize underscore to hyphen

  return Intl.NumberFormat.supportedLocalesOf(safe).length > 0 ? safe : 'en-US'
}

export function humanizeNumber(
  value,
  maximumFractionDigits = 2,
  siSeparator = ''
) {
  const locale = getSafeLocale()
  const absValue = Math.abs(value)

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  })
  const formatterSmall = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  })
  if (absValue >= 1000000000000) {
    return `${formatter.format(value / 1000000000000) + siSeparator}T`
  }
  if (absValue >= 1000000000) {
    return `${formatter.format(value / 1000000000) + siSeparator}B`
  }
  if (absValue >= 1000000) {
    return `${formatter.format(value / 1000000) + siSeparator}M`
  }
  if (absValue >= 100000) {
    return `${formatter.format(value / 1000) + siSeparator}K`
  }
  if (absValue > 10000) {
    return formatter.format(Math.round(absValue))
  }
  if (absValue > 0.01) {
    return formatter.format(value)
  }

  return formatterSmall.format(value)
}

export const formatTxs = Intl.NumberFormat(getSafeLocale(), {
  notation: 'compact',
  maximumFractionDigits: 2,
}).format

export const formatAccounts = Intl.NumberFormat(getSafeLocale(), {
  notation: 'compact',
  maximumFractionDigits: 2,
}).format

export const formatRoundtrip = Intl.NumberFormat(getSafeLocale(), {
  notation: 'compact',
  maximumFractionDigits: 2,
}).format

export const formatAssetVolume = humanizeNumber

export function formatDateTime(time) {
  return new Date(time * 1000).toLocaleString(getSafeLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDuration(seconds) {
  if (seconds === null || isNaN(seconds)) return '-'

  let remaining = Math.floor(seconds)
  const hours = Math.floor(remaining / 3600)
  remaining %= 3600
  const minutes = Math.floor(remaining / 60)
  remaining %= 60

  const secs = remaining

  const parts = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`)
  parts.push(`${secs}${hours === 0 && minutes === 0 ? '.0s' : 's'}`)

  return parts.join(' ')
}

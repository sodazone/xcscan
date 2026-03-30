import { resolveNetworkName } from '../extras'

const WELL_KNOWN = {
  'modlhb/trsry': {
    name: 'Treasury',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4 text-white/40">
  <path fill-rule="evenodd" d="M7.605 2.112a.75.75 0 0 1 .79 0l5.25 3.25A.75.75 0 0 1 13 6.707V12.5h.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H3V6.707a.75.75 0 0 1-.645-1.345l5.25-3.25ZM4.5 8.75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3ZM8 8a.75.75 0 0 0-.75.75v3a.75.75 0 0 0 1.5 0v-3A.75.75 0 0 0 8 8Zm2 .75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3ZM8 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
</svg>`,
  },
  'modl/trsry': {
    name: 'Treasury',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4 text-white/40">
  <path fill-rule="evenodd" d="M7.605 2.112a.75.75 0 0 1 .79 0l5.25 3.25A.75.75 0 0 1 13 6.707V12.5h.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H3V6.707a.75.75 0 0 1-.645-1.345l5.25-3.25ZM4.5 8.75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3ZM8 8a.75.75 0 0 0-.75.75v3a.75.75 0 0 0 1.5 0v-3A.75.75 0 0 0 8 8Zm2 .75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3ZM8 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
</svg>`,
  },
  'modlpy/trsry': {
    name: 'Treasury',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4 text-white/40">
  <path fill-rule="evenodd" d="M7.605 2.112a.75.75 0 0 1 .79 0l5.25 3.25A.75.75 0 0 1 13 6.707V12.5h.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H3V6.707a.75.75 0 0 1-.645-1.345l5.25-3.25ZM4.5 8.75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3ZM8 8a.75.75 0 0 0-.75.75v3a.75.75 0 0 0 1.5 0v-3A.75.75 0 0 0 8 8Zm2 .75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3ZM8 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
</svg>`,
  },
  '0x6d6f646c70792f74727372790000000000000000000000000000000000000000': {
    name: 'Treasury',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4 text-white/40">
  <path fill-rule="evenodd" d="M7.605 2.112a.75.75 0 0 1 .79 0l5.25 3.25A.75.75 0 0 1 13 6.707V12.5h.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H3V6.707a.75.75 0 0 1-.645-1.345l5.25-3.25ZM4.5 8.75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3ZM8 8a.75.75 0 0 0-.75.75v3a.75.75 0 0 0 1.5 0v-3A.75.75 0 0 0 8 8Zm2 .75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3ZM8 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
</svg>`,
  },
  '0x6d6f646c62662f74727372790000000000000000000000000000000000000000': {
    name: 'Treasury',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4 text-white/40">
  <path fill-rule="evenodd" d="M7.605 2.112a.75.75 0 0 1 .79 0l5.25 3.25A.75.75 0 0 1 13 6.707V12.5h.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H3V6.707a.75.75 0 0 1-.645-1.345l5.25-3.25ZM4.5 8.75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3ZM8 8a.75.75 0 0 0-.75.75v3a.75.75 0 0 0 1.5 0v-3A.75.75 0 0 0 8 8Zm2 .75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3ZM8 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
</svg>`,
  },
  '0xaf3e7da28608e13e4399cc7d14a57bdb154dde5f3d546f5f293994ef36ef7f11': {
    name: 'Polkadot Treasury',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4 text-white/40">
  <path fill-rule="evenodd" d="M7.605 2.112a.75.75 0 0 1 .79 0l5.25 3.25A.75.75 0 0 1 13 6.707V12.5h.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H3V6.707a.75.75 0 0 1-.645-1.345l5.25-3.25ZM4.5 8.75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3ZM8 8a.75.75 0 0 0-.75.75v3a.75.75 0 0 0 1.5 0v-3A.75.75 0 0 0 8 8Zm2 .75a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-1.5 0v-3ZM8 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" />
</svg>`,
  },
  // TODO: resolve by chain
  // Smart contracts
  '0x0000000000000000000000000000000000000816': {
    name: `GMP:${shortenAddress('0x0000000000000000000000000000000000000816')}`,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-code-icon lucide-file-code"><path d="M10 12.5 8 15l2 2.5"/><path d="m14 12.5 2 2.5-2 2.5"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/></svg>',
  },
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

function resolvePara(address) {
  const paraId = getParaIdFromBytes(hexToUint8Array(address))
  return resolveNetworkName(`urn:ocn:polkadot:${paraId}`) ?? paraId
}

export function systemAccountAscii(address) {
  const hex = address.replace(/^0x/, '')
  const bytes = new Uint8Array(hex.length / 2)

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }

  let asciiPart = ''
  let hexPart = ''
  let firstNonPrintableFound = false

  for (const b of bytes) {
    if (!firstNonPrintableFound && b >= 32 && b <= 126) {
      asciiPart += String.fromCharCode(b)
    } else {
      firstNonPrintableFound = true
      hexPart += b.toString(16).padStart(2, '0')
    }
  }

  hexPart = hexPart.replace(/(?:00)+$/g, '')

  return hexPart ? `${asciiPart}${hexPart}` : asciiPart
}

export function isSystemAccount(address) {
  const hex = address.replace(/^0x/, '').toLowerCase()

  const bytes = new Uint8Array(4)
  for (let i = 0; i < 4; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }

  return new TextDecoder('ascii').decode(bytes) === 'modl'
}

export function decodeWellKnownAddressHTML(address) {
  const para = '0x70617261'
  const sibl = '0x7369626c'

  if (address.startsWith(para) || address.startsWith(sibl)) {
    return `<div class="flex space-x-1 items-center" title="Sovereign Account">
<span>${resolvePara(address)}</span>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4 text-white/40">
  <path fill-rule="evenodd" d="M8.75 2.5a.75.75 0 0 0-1.5 0v.508a32.661 32.661 0 0 0-4.624.434.75.75 0 0 0 .246 1.48l.13-.021-1.188 4.75a.75.75 0 0 0 .33.817A3.487 3.487 0 0 0 4 11c.68 0 1.318-.195 1.856-.532a.75.75 0 0 0 .33-.818l-1.25-5a31.31 31.31 0 0 1 2.314-.141V12.012c-.882.027-1.752.104-2.607.226a.75.75 0 0 0 .213 1.485 22.188 22.188 0 0 1 6.288 0 .75.75 0 1 0 .213-1.485 23.657 23.657 0 0 0-2.607-.226V4.509c.779.018 1.55.066 2.314.14L9.814 9.65a.75.75 0 0 0 .329.818 3.487 3.487 0 0 0 1.856.532c.68 0 1.318-.195 1.856-.532a.75.75 0 0 0 .33-.818L12.997 4.9l.13.022a.75.75 0 1 0 .247-1.48 32.66 32.66 0 0 0-4.624-.434V2.5ZM3.42 9.415a2 2 0 0 0 1.16 0L4 7.092l-.58 2.323ZM12 9.5a2 2 0 0 1-.582-.085L12 7.092l.58 2.323A2 2 0 0 1 12 9.5Z" clip-rule="evenodd" />
</svg>
</div>`
  }

  let maybeWellKnown = address

  if (isSystemAccount(address)) {
    maybeWellKnown = systemAccountAscii(address)
  }

  if (WELL_KNOWN[maybeWellKnown] != null) {
    const { name, svg } = WELL_KNOWN[maybeWellKnown]
    return `<div class="flex space-x-1 items-center" title="${name}">
    <span>${name}</span>
    ${svg}
    </div>`
  }

  return null
}

export function shortenAddress(address) {
  if (!address || typeof address !== 'string') return ''

  if (address.startsWith('0x') && address.length === 42) {
    return `${address.slice(0, 6)}…${address.slice(-4)}`
  }

  if (address.length < 20) {
    return address
  }

  if (address.length >= 40) {
    return `${address.slice(0, 8)}…${address.slice(-8)}`
  }

  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function resolveAddress({ address, formatted, shorten = true }) {
  if (address.startsWith('urn')) {
    return null
  }

  const system = isSystemAccount(address)

  const addr = system ? systemAccountAscii(address) : address

  const wellKnown = decodeWellKnownAddressHTML(addr)
  if (wellKnown) {
    return wellKnown
  }

  if (system) {
    return addr
  }

  return shorten ? shortenAddress(formatted ?? addr) : (formatted ?? addr)
}

export function extractDisplayName(account) {
  if (account === undefined) {
    return null
  }
  for (const identity of account.identities) {
    if (identity.display && identity.display !== '') {
      return identity.display
    }
  }

  for (const t of account.tags) {
    const [_type, value] = t.tag.split(':')
    if (value) {
      return value
    }
  }
  return null
}

export function extractTags(account) {
  if (account === undefined) {
    return null
  }

  const tags = new Set()
  for (const identity of account.identities) {
    if (identity.display && identity.display !== '') {
      tags.add(identity.display)
    }
  }

  for (const t of account.tags) {
    tags.add(t.tag)
  }
  return [...tags]
}

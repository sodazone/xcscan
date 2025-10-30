const protocolIcons = {
  xcm: {
    label: 'XCM',
    icon: ({ size = 5, color = '#07FFFF' } = {}) => `
      <svg class="size-${size}" viewBox="0 0 10.054 10.054" xmlns="http://www.w3.org/2000/svg" style="color:${color};">
        <g transform="matrix(1.1805 0 0 1.1805 -1.0598 -2.1088)" stroke-width=".26458" fill="currentColor" fill-opacity="0.5">
          <path d="m5.6853 3.6381h1.0583c0.89916 0 1.5875 0.68834 1.5875 1.5875s-0.68834 1.5875-1.5875 1.5875h-1.0583v1.0583h1.0583c1.4821 0 2.6458-1.1637 2.6458-2.6458s-1.1637-2.6458-2.6458-2.6458h-1.0583"/>
          <path d="m4.6269 6.8131h-1.0583c-0.89916 0-1.5875-0.68834-1.5875-1.5875s0.68834-1.5875 1.5875-1.5875h1.0583v-1.0583h-1.0583c-1.4821 0-2.6458 1.1637-2.6458 2.6458s1.1637 2.6458 2.6458 2.6458h1.0583"/>
          <path d="m6.7436 5.7547v-1.0583h-3.175v1.0583z"/>
        </g>
      </svg>
    `,
  },
  wh_relayer: {
    label: 'Relay',
    icon: ({ size = 5, color = '#FFFFFF' } = {}) => `
      <svg fill="none" viewBox="0 0 28 28" class="size-${size}" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="26" height="26" rx="13" fill="transparent" stroke="transparent" stroke-width="2"></rect><path d="M21 13.5703V18.6387L14 22.4037L7 18.6387V13.5703" stroke="${color}" stroke-width="1.73782"></path><path d="M21 8.92188L21 13.9902L14 17.7553L7 13.9902V8.92188" stroke="${color}" stroke-width="1.73782"></path><path d="M14 12.8381L7 9.36271V9.07309L14 5.59766L21 9.07309L21 9.36271L14 12.8381Z" fill="${color}" stroke="${color}" stroke-width="1.73782"></path></svg>
    `,
  },
  wh_portal: {
    label: 'Portal',
    icon: ({ size = 5, color = '#FFFFFF' } = {}) => `
      <svg fill="none" class="size-${size}" viewBox="-20 -20 276 198" xmlns="http://www.w3.org/2000/svg"><path d="M182.7 0.979492H53.2752C23.9743 0.979492 0.250977 25.3066 0.250977 55.3381V102.662C0.250977 132.694 23.9743 157.021 53.2752 157.021H184.509V156.944C212.967 155.972 235.749 132.08 235.749 102.688V55.3637C235.749 25.3322 212.025 1.00507 182.725 1.00507L182.7 0.979492ZM168.782 128.62H67.9726V28.2542H168.782V128.62Z" fill="${color}"></path></svg>
    `,
  },
  snowbridge: {
    label: 'Snowbridge',
    icon: ({ size = 5 } = {}) => `
      <img src='/snowbridge.webp' class="h-${size} w-${size} rounded-full bg-white/90" />
    `,
  },
  pkbridge: {
    label: 'Polkadot-Kusama Bridge',
    icon: ({ size = 5, color = '#FFFFFF' } = {}) => `
      <svg class="size-${size} align-middle" viewBox="0 0 10.054 10.054" xmlns="http://www.w3.org/2000/svg" style="color:${color};">
        <g transform="matrix(1.1805 0 0 1.1805 -1.0598 -2.1088)" stroke-width=".26458" fill="currentColor" fill-opacity="0.5">
          <path d="m5.6853 3.6381h1.0583c0.89916 0 1.5875 0.68834 1.5875 1.5875s-0.68834 1.5875-1.5875 1.5875h-1.0583v1.0583h1.0583c1.4821 0 2.6458-1.1637 2.6458-2.6458s-1.1637-2.6458-2.6458-2.6458h-1.0583"/>
          <path d="m4.6269 6.8131h-1.0583c-0.89916 0-1.5875-0.68834-1.5875-1.5875s0.68834-1.5875 1.5875-1.5875h1.0583v-1.0583h-1.0583c-1.4821 0-2.6458 1.1637-2.6458 2.6458s1.1637 2.6458 2.6458 2.6458h1.0583"/>
          <path d="m6.7436 5.7547v-1.0583h-3.175v1.0583z"/>
        </g>
      </svg>
    `,
  },
}

export function resolveProtocol(name, { size, color, showLabels = true } = {}) {
  if (!name) return ''
  const entry = protocolIcons[name.toLowerCase()]
  const icon = entry ? entry.icon({ size, color }) : ''
  const label = showLabels
    ? `<span class="leading-none">${entry?.label || name}</span>`
    : ''
  return `<span class="flex items-center space-x-2">${icon}${label}</span>`
}

export function resolveProtocols(names = [], opts = {}) {
  const validNames = names.filter(Boolean)
  if (!validNames.length) return ''
  if (validNames.length === 1 || validNames[0] === validNames[1])
    return resolveProtocol(validNames[0], opts)

  const items = validNames.map((n) => {
    const icon = protocolIcons[n.toLowerCase()]?.icon(opts) || ''
    const label =
      opts.showLabels !== false
        ? protocolIcons[n.toLowerCase()]?.label || n
        : ''
    return `<span class="flex items-center space-x-2">${icon}<span>${label}</span></span>`
  })

  return `<span class="flex items-center gap-3">
    ${items.join('<span class="text-gray-500">+</span>')}
  </span>`
}

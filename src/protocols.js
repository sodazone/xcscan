const protocolIcons = {
  xcm: {
    label: 'XCM',
    icon: ({ size = 4, color = '#07FFFF' } = {}) => `
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

export function resolveProtocol(
  name,
  { size = 4, color = '#07FFFF', showLabels = true } = {}
) {
  if (!name) return ''
  const entry = protocolIcons[name.toLowerCase()]
  const icon = entry ? entry.icon({ size, color }) : ''
  const label = showLabels
    ? `<span class="leading-none">${entry?.label || name}</span>`
    : ''
  return `<span class="flex items-center space-x-1">${icon}${label}</span>`
}

export function resolveProtocols(names = [], opts = {}) {
  const validNames = names.filter(Boolean)
  if (!validNames.length) return ''
  if (validNames.length === 1 || validNames[0] === validNames[1])
    return resolveProtocol(validNames[0], opts)

  const icons = validNames.map(
    (n) => protocolIcons[n.toLowerCase()]?.icon(opts) || ''
  )
  const labels =
    opts.showLabels !== false
      ? validNames
          .map((n) => protocolIcons[n.toLowerCase()]?.label || n)
          .join(' + ')
      : ''
  return `<span class="flex items-center space-x-1">
    <span class="flex -space-x-1">${icons.join('')}</span>
    ${labels ? `<span class="leading-none">${labels}</span>` : ''}
  </span>`
}

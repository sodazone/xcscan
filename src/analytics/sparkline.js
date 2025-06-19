export function drawSparkline(conf) {
  function setup(opts) {
    const defaultOpts = {
      width: parseIntWithDefault(opts.dataset.width, 100),
      height: parseIntWithDefault(opts.dataset.height, 30),
      gap: parseIntWithDefault(opts.dataset.gap, 5),
      strokeWidth: parseIntWithDefault(opts.dataset.strokeWidth, 2),
      type: opts.dataset.type || 'bar',
      colors: opts.dataset.colors
        ? opts.dataset.colors.split(',')
        : ['#669999'],
      points: opts.dataset.points
        ? opts.dataset.points.split(',').map(Number)
        : [],
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute(
      'viewBox',
      `0 0 ${defaultOpts.width} ${defaultOpts.height}`
    )
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')
    defaultOpts.svg = svg
    return defaultOpts
  }

  function parseIntWithDefault(val, defaultValue) {
    const parsed = Number.parseInt(val, 10)
    return Number.isNaN(parsed) ? defaultValue : parsed
  }

  function bar(opts) {
    const { points, width, height, gap, colors, svg } = opts
    const totalBars = points.length
    const columnWidth = Math.max(5, (width - (totalBars - 1) * gap) / totalBars)
    const maxValue = Math.max(...points) || 1

    points.forEach((point, idx) => {
      const color =
        point === 0 ? 'rgba(255,255,255,0.25)' : colors[idx % colors.length]
      const rect = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect'
      )

      let rectHeight = (point / maxValue) * height
      if (rectHeight < 3) rectHeight = 3 // Ensure visibility for small values

      const x = idx * (columnWidth + gap)
      const y = height - rectHeight

      rect.setAttribute('x', x)
      rect.setAttribute('y', y)
      rect.setAttribute('width', columnWidth)
      rect.setAttribute('height', rectHeight)
      rect.setAttribute('fill', color)
      rect.setAttribute('stroke', 'rgba(0,0,0,0.75)')
      rect.setAttribute('stroke-width', '0.5')

      svg.appendChild(rect)
    })
  }

  function render(opts) {
    if (opts.type === 'bar') {
      bar(opts)
    } else {
      console.error(`${opts.type} is not a valid sparkline type`)
    }
  }

  // Initialize and render the chart
  const opts = setup(conf)
  render(opts)

  const container = document.createElement('div')
  container.className = 'w-full pt-1'
  container.appendChild(opts.svg)
  return container
}

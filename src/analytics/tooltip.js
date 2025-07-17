export function createChartTooltipHTML({ title, amount, unit, date, events }) {
  return `<div class="flex flex-col gap-1 p-2 text-xs">
        <div class="flex flex-col gap-1 text-white/90">
          <span class="text-white/60 font-semibold">${title}</span>
          ${
            unit == null
              ? amount
              : `<span class="flex gap-1 items-baseline">
            <span class="text-lg font-semibold">${amount}</span>
            <span class="text-white/60 text-sm">${unit}</span>
          </span>`
          }
        </div>
        <div class="text-white/60">${date}</div>
        ${
          events == null || events.length == 0
            ? ''
            : `<div class="flex flex-col mt-2 space-y-4">${events
                .map((event) => {
                  return `<div class="flex items-center space-x-1">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#ffa500" class="size-3">
  <path d="M3.6 1.7A.75.75 0 1 0 2.4.799a6.978 6.978 0 0 0-1.123 2.247.75.75 0 1 0 1.44.418c.187-.644.489-1.24.883-1.764ZM13.6.799a.75.75 0 1 0-1.2.9 5.48 5.48 0 0 1 .883 1.765.75.75 0 1 0 1.44-.418A6.978 6.978 0 0 0 13.6.799Z" />
  <path fill-rule="evenodd" d="M8 1a4 4 0 0 1 4 4v2.379c0 .398.158.779.44 1.06l1.267 1.268a1 1 0 0 1 .293.707V11a1 1 0 0 1-1 1h-2a3 3 0 1 1-6 0H3a1 1 0 0 1-1-1v-.586a1 1 0 0 1 .293-.707L3.56 8.44A1.5 1.5 0 0 0 4 7.38V5a4 4 0 0 1 4-4Zm0 12.5A1.5 1.5 0 0 1 6.5 12h3A1.5 1.5 0 0 1 8 13.5Z" clip-rule="evenodd" />
</svg><span class="text-white/90 truncate">${event.tooltip}</span>
            </div>`
                })
                .join('')}</div>`
        }
      </div>`
}

function createCachedOnDisplay(onDisplay, currentKey) {
  const cache = new Map()

  return (param) => {
    const timeKey =
      typeof param.time === 'object'
        ? JSON.stringify(param.time)
        : String(param.time)
    const key = `${timeKey}|${currentKey()}`

    if (!cache.has(key)) {
      cache.set(key, onDisplay(param))
    }
    return cache.get(key)
  }
}

export function createChartTooltip({ element, chart, onDisplay, currentKey }) {
  const toolTipWidth = 80
  const toolTipHeight = 80
  const toolTipMargin = 15

  const onDisplayWithCache = createCachedOnDisplay(onDisplay, currentKey)

  const toolTip = document.createElement('div')
  toolTip.className = 'chart-series-tooltip'
  element.appendChild(toolTip)

  chart.subscribeCrosshairMove((param) => {
    if (
      !param.point ||
      !param.time ||
      param.point.x < 0 ||
      param.point.x > element.clientWidth ||
      param.point.y < 0 ||
      param.point.y > element.clientHeight
    ) {
      toolTip.style.display = 'none'
      return
    }

    toolTip.style.display = 'block'
    toolTip.innerHTML = onDisplayWithCache(param)

    const y = param.point.y
    let left = param.point.x + toolTipMargin
    if (left > element.clientWidth - toolTipWidth) {
      left = param.point.x - toolTipMargin - toolTipWidth
    }

    let top = y + toolTipMargin
    if (top > element.clientHeight - toolTipHeight) {
      top = y - toolTipHeight - toolTipMargin
    }

    toolTip.style.left = `${left}px`
    toolTip.style.top = `${top}px`
  })
}

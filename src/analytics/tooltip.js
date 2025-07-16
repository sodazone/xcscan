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
                  return `<div class="flex items-center space-x-2">
             <span class="size-2 bg-[#ffa500]"></span><span class="text-white/90 truncate">${event.tooltip}</span>
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

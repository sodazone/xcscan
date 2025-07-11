export function createChartTooltipHTML({ title, amount, unit, date }) {
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
      </div>`
}

export function createChartTooltip({ element, chart, onDisplay }) {
  const toolTipWidth = 80
  const toolTipHeight = 80
  const toolTipMargin = 15

  const toolTip = document.createElement('div')
  toolTip.className = 'chart-series-tooltip'
  element.appendChild(toolTip)

  element.addEventListener('touchmove', (e) => {
    const touch = e.touches[0]
    const boundingRect = element.getBoundingClientRect()
    const x = touch.clientX - boundingRect.left
    const y = touch.clientY - boundingRect.top
    chart.setCrosshairPosition(x, y)
  })

  element.addEventListener('touchend', () => {
    chart.clearCrosshairPosition()
  })

  chart.subscribeCrosshairMove((param) => {
    if (
      param.point === undefined ||
      !param.time ||
      param.point.x < 0 ||
      param.point.x > element.clientWidth ||
      param.point.y < 0 ||
      param.point.y > element.clientHeight
    ) {
      toolTip.style.display = 'none'
    } else {
      toolTip.style.display = 'block'
      toolTip.innerHTML = onDisplay(param)

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
    }
  })
}

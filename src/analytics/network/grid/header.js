const DEFAULT_DESCRIPTIONS = {
  volume: 'Shows the volume trend in USD',
  asset: 'Shows the asset amount trend',
  count: 'Shows the number of transfers trend',
}

const TIMEFRAME = {
  daily: 'last 24 hours',
  weekly: 'last 7 days',
  monthly: 'last 30 days',
  quarterly: 'last 3 months',
}

function getTooltipText(description, timeframe) {
  const text = description ?? 'Trend'
  return `${text} over ${TIMEFRAME[timeframe]}`
}

export class TrendHeader {
  init(params) {
    this.params = params
    this.currentType = params.context?.initialType || 'volume'
    this.currentTimeframe = params.context?.initialTimeframe || 'monthly'
    this.descriptions = params.context?.descriptions || DEFAULT_DESCRIPTIONS

    this.eGui = document.createElement('div')
    this.eGui.className = 'ag-header-cell-label flex items-center gap-1'
    this.eGui.innerHTML = `
      <span class="header-text">${params.displayName}</span>
      <button class="info-button" tabindex="0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
          />
        </svg>
      </button>
    `
    this.tooltipButton = this.eGui.querySelector('.info-button')

    this.updateTooltip()

    if (params.context?.eventName) {
      window.addEventListener(params.context.eventName, (e) => {
        this.currentType = e.detail
        this.updateTooltip()
      })
    }

    window.addEventListener('timeChanged', (e) => {
      this.currentTimeframe = e.detail
      this.updateTooltip()
    })
  }

  updateTooltip() {
    const text = getTooltipText(
      this.descriptions[this.currentType],
      this.currentTimeframe
    )
    this.tooltipButton.setAttribute('title', text)
  }

  getGui() {
    return this.eGui
  }
}

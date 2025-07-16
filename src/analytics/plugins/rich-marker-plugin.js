/**
 * @typedef {{
 *   time: number | string | import('lightweight-charts').Time;
 *   text: string;
 *   shape?: 'rectangle' | 'circle' | 'rounded' | 'tab';
 *   label?: string;
 *   color?: string;
 *   backgroundColor?: string;
 *   borderColor?: string;
 *   size?: number;
 *   yOffset?: number;
 * }} RichMarker
 */

/**
 * A renderer for styled rich markers.
 */
class RichMarkerRenderer {
  constructor() {
    this._data = []
    this._imageCache = new Map()
  }

  /**
   * @param {{ markers: RichMarker[], series: any }} data
   */
  update(data) {
    if (!data.chart || !data.series) return

    this._data = data.markers
      .map((marker) => {
        const x = data.chart.timeScale().timeToCoordinate(marker.time)
        const y = data.series.priceToCoordinate(marker.price ?? 0)
        if (x === null || y === null) return null

        return { ...marker, x, y }
      })
      .filter((m) => m !== null)
  }

  /**
   * @param {import('fancy-canvas').CanvasRenderingTarget2D} target
   */
  draw(target) {
    target.useMediaCoordinateSpace((scope) => {
      const ctx = scope.context

      for (const marker of this._data) {
        const {
          x,
          y,
          size = 14,
          backgroundColor = '#ffa500',
          borderColor = '#252525',
          color = 'rgba(20,10,0,0.7)',
          label = 'A',
        } = marker

        const yPos = y - (marker.yOffset ?? size)

        // Label box
        ctx.font = `bold ${size - 2}px sans-serif`
        ctx.textBaseline = 'middle'
        const paddingX = 4
        const height = size + 2
        const textWidth = ctx.measureText(label).width
        const width = textWidth + paddingX * 2

        // Label position
        const labelAbove = yPos - 30 > 0
        const verticalOffset = labelAbove ? -size / 2 : size / 2
        const labelY = yPos + verticalOffset
        const boxY = labelY - height / 2
        const boxX = x - width / 2

        // Connector line
        ctx.beginPath()
        ctx.strokeStyle = backgroundColor
        ctx.lineWidth = 0.5
        ctx.moveTo(x, yPos + height)
        const lineEndY = labelAbove ? boxY + height : boxY
        ctx.lineTo(x, lineEndY)
        ctx.stroke()

        // Price dot
        ctx.beginPath()
        ctx.fillStyle = backgroundColor
        ctx.arc(x, y, 2, 0, 2 * Math.PI)
        ctx.fill()

        // Label shape
        ctx.save()

        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 2

        ctx.beginPath()
        ctx.fillStyle = backgroundColor
        ctx.strokeStyle = borderColor
        ctx.lineWidth = 0.5

        switch (marker.shape) {
          case 'circle': {
            const radius = Math.max(width, height) / 2
            ctx.arc(x, labelY, radius, 0, 2 * Math.PI)
            break
          }

          case 'tab': {
            const triangleHeight = 6

            ctx.moveTo(boxX, boxY)
            ctx.lineTo(boxX + width, boxY)
            ctx.lineTo(boxX + width, boxY + height)
            ctx.lineTo(x, boxY + height + triangleHeight)
            ctx.lineTo(boxX, boxY + height)
            ctx.closePath()
            break
          }

          case 'rectangle': {
            ctx.rect(boxX, boxY, width, height)
            break
          }

          default: {
            ctx.roundRect(boxX, boxY, width, height, 4)
            break
          }
        }

        ctx.fill()
        ctx.stroke()
        ctx.restore()

        // Label text
        ctx.fillStyle = color
        ctx.textAlign = 'center'
        ctx.fillText(label, x, labelY + 1)
      }
    })
  }
}

class RichMarkerView {
  constructor() {
    this._renderer = new RichMarkerRenderer()
  }

  renderer() {
    return this._renderer
  }

  update(data) {
    this._renderer.update(data)
  }
}

export class RichMarkerPlugin {
  constructor(markers = []) {
    /** @type {RichMarker[]} */
    this._markers = markers
    this._paneViews = [new RichMarkerView()]
    this._series = null
    this._requestUpdate = null
  }

  updateMarkers(markers) {
    this._markers = markers
    this.updateAllViews()
    if (this._requestUpdate) this._requestUpdate()
  }

  applyOptions() {}

  attached({ chart, series, requestUpdate }) {
    this._chart = chart
    this._series = series
    this._requestUpdate = requestUpdate
  }

  detached() {
    this._series = null
  }

  updateAllViews() {
    if (!this._series || !this._chart) return

    const data = {
      chart: this._chart,
      series: this._series,
      markers: this._markers,
    }

    this._paneViews.forEach((view) => view.update(data))
  }

  paneViews() {
    return this._paneViews
  }
}

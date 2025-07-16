import { AreaSeries, createChart } from 'lightweight-charts'

import { getTransfersCount } from './api.js'
import { formatAssetVolume, formatDateTime } from '../formats.js'
import { createAvgLine } from './avg-line.js'
import { installResizeHandler } from './resize.js'
import { createChartTooltip, createChartTooltipHTML } from './tooltip.js'
import { createMarkers } from './markers.js'
import { GLOBAL_MARKERS } from './markers/data.js'

export function setupSeriesChart(element) {
  let chart
  let series
  let averageLine
  let markers
  let data
  let currentTimeFrame
  let currentType = 'volume'

  function install() {
    const chartOptions = {
      autoSize: true,
      handleScroll: false,
      handleScale: false,
      layout: {
        attributionLogo: false,
        textColor: 'rgba(255,255,255,0.5)',
        background: { color: 'transparent' },
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: true,
          style: 0,
          color: 'rgba(255,255,255,0.05)',
        },
      },
      crosshair: {
        horzLine: {
          visible: false,
          labelVisible: false,
        },
        vertLine: {
          labelVisible: false,
          visible: false,
        },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      localization: {
        priceFormatter: (p) =>
          currentType === 'volume' ? formatAssetVolume(p) : p.toFixed(0),
      },
    }
    chart = createChart(element, chartOptions)
    series = chart.addSeries(AreaSeries, {
      lastValueVisible: false,
      crosshairMarkerVisible: true,
      priceLineVisible: false,
      lineColor: '#669999',
      topColor: 'rgba(102,153,153, 0.25)',
      bottomColor: 'transparent',
      lineWidth: 1.5,
      priceFormat: {
        type: 'price',
        precision: 0,
      },
      autoscaleInfoProvider: (original) => {
        const res = original()
        if (res !== null) {
          res.priceRange.minValue = 0
        }
        return res
      },
    })

    series.priceScale().applyOptions({
      scaleMargins: {
        top: 0.2,
        bottom: 0.05,
      },
    })

    averageLine = createAvgLine(series)

    chart.timeScale().applyOptions({
      borderColor: 'transparent',
      timeVisible: true,
      secondsVisible: false,
    })

    markers = createMarkers(series, GLOBAL_MARKERS)

    createChartTooltip({
      element,
      chart,
      currentKey: () => currentType,
      onDisplay: (param) => {
        const dateStr = formatDateTime(param.time)
        const dataPoint = param.seriesData.get(series)
        const price =
          dataPoint.value !== undefined ? dataPoint.value : dataPoint.close
        const events = markers.getEventTooltips(param.time)
        return createChartTooltipHTML({
          title: currentType === 'volume' ? 'Volume' : 'Transfers',
          amount:
            currentType === 'volume'
              ? formatAssetVolume(price)
              : Number(price).toFixed(0),
          unit: currentType === 'volume' ? 'USD' : 'txs',
          date: dateStr,
          events,
        })
      },
    })
  }

  function update(period, type = 'volume') {
    currentType = type
    currentTimeFrame = period
    getTransfersCount(period)
      .then((newData) => {
        if (type === 'volume') {
          data = newData.volume.slice(0, -1)
        } else {
          data = newData.transfers.slice(0, -1)
        }
        averageLine.setData(data)
        series.setData(data)
        markers.setData(data)
        chart.timeScale().fitContent()
      })
      .catch(console.error)
  }

  install()

  window.addEventListener('timeChanged', (e) => {
    update(e.detail, currentType)
  })

  window.addEventListener('seriesTypeChanged', (e) => {
    update(currentTimeFrame, e.detail)
  })

  installResizeHandler(() => {
    element.textContent = ''
    install()

    averageLine.setData(data)
    series.setData(data)
    markers.setData(data)
    chart.timeScale().fitContent()
  })
}

import {
  AreaSeries,
  LineSeries,
  HistogramSeries,
  createChart,
} from 'lightweight-charts'

import { getTransfersByNetworkSeries } from '../api.js'
import { formatAssetVolume } from '../../formats.js'

export function setupNetworkSeriesChart(element, network) {
  let chart
  let inflowSeries, outflowSeries, netflowSeries, series
  let data
  let flowsData
  let currentTimeFrame
  let currentType = 'volume'
  const flowPriceScaleId = 'right'

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
        visible: true,
        borderVisible: false,
      },
      localization: {
        priceFormatter: (p) => formatValue(p),
      },
    }
    chart = createChart(element, chartOptions)
    createFlowSeries()
    createSingleSeries()

    series.priceScale().applyOptions({
      scaleMargins: {
        top: 0.2,
        bottom: 0.05,
      },
    })

    chart.timeScale().applyOptions({
      borderColor: 'transparent',
      timeVisible: true,
      secondsVisible: false,
    })

    const toolTipWidth = 80
    const toolTipHeight = 80
    const toolTipMargin = 15

    // Create and style the tooltip html element
    const toolTip = document.createElement('div')
    toolTip.className = 'chart-series-tooltip'
    element.appendChild(toolTip)

    // update tooltip
    chart.subscribeCrosshairMove((param) => {
      if (
        param === undefined ||
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > element.clientWidth ||
        param.point.y < 0 ||
        param.point.y > element.clientHeight
      ) {
        toolTip.style.display = 'none'
      } else {
        const dateStr = new Date(param.time * 1000).toUTCString()
        toolTip.style.display = 'block'

        if (currentType === 'flow') {
          const inflowData = param.seriesData.get(inflowSeries)
          const outflowData = param.seriesData.get(outflowSeries)
          const netflowData = param.seriesData.get(netflowSeries)

          const inflowVal = inflowData?.value ?? '-'
          const outflowVal =
            outflowData?.value !== undefined ? Math.abs(outflowData.value) : '-'
          const netflowVal = netflowData?.value ?? '-'

          toolTip.innerHTML = `
          <div class="flex flex-col gap-2">
            <div class="flex flex-col gap-1">
              <div>in: ${formatAssetVolume(inflowVal)}</div>
              <div>out: ${formatAssetVolume(outflowVal)}</div>
              <div>net: ${formatAssetVolume(netflowVal)}</div>
            </div>
            <div class="text-white/50 text-xs">
              ${dateStr}
            </div>
          </div>`
        } else {
          const dataPoint = param.seriesData.get(series)
          if (dataPoint) {
            const price =
              dataPoint.value !== undefined ? dataPoint.value : dataPoint.close
            toolTip.innerHTML = `
              <div class="flex flex-col gap-2">
              <div class="flex gap-1 items-end">
                <span class="text-white/80 text-xl font-medium">${formatValue(price)}</span>
                <span class="text-white/50 text-sm">${formatLabel()}</span>
              </div>
              <div class="text-white/50 text-xs">
                ${dateStr}
              </div>
              </div>`
          }
        }

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

  function update(period, type = 'volume') {
    currentType = type
    currentTimeFrame = period
    getTransfersByNetworkSeries(period, network)
      .then((newData) => {
        removeAllSeries()
        if (type === 'flow') {
          createFlowSeries()
          const inflowData = newData.flows.in.slice(0, -1)
          const outflowData = newData.flows.out
            .map(({ time, value }) => ({ time, value: -value }))
            .slice(0, -1)
          const netflowData = newData.flows.net.slice(0, -1)
          flowsData = {
            in: inflowData,
            out: outflowData,
            net: netflowData,
          }

          inflowSeries.setData(inflowData)
          outflowSeries.setData(outflowData)
          netflowSeries.setData(netflowData)
        } else {
          createSingleSeries()

          if (type === 'volume') {
            data = newData.volume.slice(0, -1)
          } else if (type === 'count') {
            data = newData.transfers.slice(0, -1)
          } else {
            data = newData.share.slice(0, -1)
          }
          series.setData(data)
        }
        chart.timeScale().fitContent()
      })
      .catch(console.error)
  }

  function formatValue(data) {
    if (currentType === 'volume' || currentType === 'flow') {
      return formatAssetVolume(data)
    }
    if (currentType === 'count') {
      return Number(data).toFixed(0)
    }
    return Number(data).toFixed(1)
  }

  function formatLabel() {
    if (currentType === 'volume' || currentType === 'flow') {
      return 'usd'
    }
    if (currentType === 'count') {
      return 'tx'
    }
    return '%'
  }

  function createSingleSeries() {
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
  }

  function createFlowSeries() {
    inflowSeries = chart.addSeries(HistogramSeries, {
      lastValueVisible: false,
      crosshairMarkerVisible: true,
      priceLineVisible: false,
      color: 'rgba(188, 244, 166, 0.65)', // teal-ish
      priceFormat: {
        type: 'price',
        precision: 0,
      },
      priceScaleId: flowPriceScaleId,
      scaleMargins: {
        top: 0.6,
        bottom: 0.4,
      },
    })

    outflowSeries = chart.addSeries(HistogramSeries, {
      lastValueVisible: false,
      crosshairMarkerVisible: true,
      priceLineVisible: false,
      color: 'rgba(255, 151, 147, 0.65)',
      priceFormat: {
        type: 'price',
        precision: 0,
      },
      priceScaleId: flowPriceScaleId,
      scaleMargins: {
        top: 0.4,
        bottom: 0.6,
      },
    })

    netflowSeries = chart.addSeries(LineSeries, {
      lastValueVisible: false,
      crosshairMarkerVisible: true,
      priceLineVisible: false,
      color: 'rgba(247, 249, 247, 0.75)',
      lineWidth: 2,
      priceScaleId: flowPriceScaleId,
      priceFormat: {
        type: 'price',
        precision: 0,
      },
    })
  }

  function removeAllSeries() {
    if (inflowSeries) {
      try {
        chart.removeSeries(inflowSeries)
      } finally {
        inflowSeries = null
      }
    }
    if (outflowSeries) {
      try {
        chart.removeSeries(outflowSeries)
      } finally {
        outflowSeries = null
      }
    }
    if (netflowSeries) {
      try {
        chart.removeSeries(netflowSeries)
      } finally {
        netflowSeries = null
      }
    }
    if (series) {
      try {
        chart.removeSeries(series)
      } finally {
        series = null
      }
    }
  }

  install()

  window.addEventListener('timeChanged', (e) => {
    update(e.detail, currentType)
  })

  window.addEventListener('seriesTypeChanged', (e) => {
    update(currentTimeFrame, e.detail)
  })

  let w =
    window.innerWidth ||
    document.documentElement.clientWidth ||
    document.body.clientWidth
  window.addEventListener('resize', () => {
    const nw =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth
    if (w !== nw) {
      w = nw

      element.textContent = ''
      install()

      if (currentType === 'flow') {
        inflowSeries.setData(flowsData.in)
        outflowSeries.setData(flowsData.out)
        netflowSeries.setData(flowsData.net)
      } else {
        series.setData(data)
      }
      chart.timeScale().fitContent()
    }
  })
}

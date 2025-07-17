import {
  AreaSeries,
  LineSeries,
  HistogramSeries,
  createChart,
} from 'lightweight-charts'

import { getTransfersByNetworkSeries } from '../api.js'
import { formatAssetVolume, formatDateTime } from '../../formats.js'
import { createAvgLine } from '../avg-line.js'
import { installResizeHandler } from '../resize.js'
import { createChartTooltip, createChartTooltipHTML } from '../tooltip.js'

const TITLES = {
  volume: 'Volume',
  count: 'Transfers',
  share: 'Share',
  flow: 'Net Flow',
}

export function setupNetworkSeriesChart(element, network) {
  let chart
  let inflowSeries, outflowSeries, netflowSeries, series
  let data
  let averageLine
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

    createChartTooltip({
      element,
      chart,
      currentKey: () => currentType,
      onDisplay: (param) => {
        const dateStr = formatDateTime(param.time)
        if (currentType === 'flow') {
          const inflowData = param.seriesData.get(inflowSeries)
          const outflowData = param.seriesData.get(outflowSeries)
          const netflowData = param.seriesData.get(netflowSeries)

          const inflowVal = inflowData?.value ?? '-'
          const outflowVal =
            outflowData?.value !== undefined ? Math.abs(outflowData.value) : '-'
          const netflowVal = netflowData?.value ?? '-'

          return createChartTooltipHTML({
            title: TITLES[currentType],
            amount: `<div class="grid grid-cols-[auto_1fr] w-full gap-x-2 gap-y-1 text-xs font-mono">
  <div class="text-white/40">in</div>
  <div class="text-positive text-right text-sm tabular-nums">${formatAssetVolume(inflowVal)}</div>
  <div class="text-white/40">out</div>
  <div class="text-negative text-right text-sm tabular-nums">${formatAssetVolume(outflowVal)}</div>
  <div class="text-white/40">net</div>
  <div class="text-white/90 text-right text-sm tabular-nums">${formatAssetVolume(netflowVal)}</div>
</div>`,
            date: dateStr,
          })
        } else {
          const dataPoint = param.seriesData.get(series)
          if (dataPoint) {
            const price =
              dataPoint.value !== undefined ? dataPoint.value : dataPoint.close
            return createChartTooltipHTML({
              title: TITLES[currentType],
              amount: formatValue(price),
              unit: formatLabel(),
              date: dateStr,
            })
          }
        }
      },
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
          averageLine.setData(data)
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
    return `${Number(data).toFixed(0)}%`
  }

  function formatLabel() {
    if (currentType === 'volume' || currentType === 'flow') {
      return 'usd'
    }
    if (currentType === 'count') {
      return 'tx'
    }
    return ''
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
      autoscaleInfoProvider: (original) => {
        const res = original()
        if (res !== null) {
          res.priceRange.minValue = 0
        }
        return res
      },
    })

    averageLine = createAvgLine(series)
  }

  function createFlowSeries() {
    inflowSeries = chart.addSeries(HistogramSeries, {
      lastValueVisible: false,
      crosshairMarkerVisible: true,
      priceLineVisible: false,
      color: 'rgba(102, 153, 153, 0.85)',
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
      color: 'rgba(51, 75, 75, 0.85)',
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
      color: 'rgb(244, 202, 198)',
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

  installResizeHandler(() => {
    element.textContent = ''
    install()

    if (currentType === 'flow') {
      inflowSeries.setData(flowsData.in)
      outflowSeries.setData(flowsData.out)
      netflowSeries.setData(flowsData.net)
    } else {
      series.setData(data)
      averageLine.setData(data)
    }
    chart.timeScale().fitContent()
  })
}

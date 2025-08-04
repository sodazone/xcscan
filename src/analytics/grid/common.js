import { themeQuartz } from 'ag-grid-community'

import {
  loadExtraInfos,
  resolveAssetIcon,
  resolveNetworkIcon,
  resolveNetworkName,
} from '../../extras.js'
import { formatAssetVolume } from '../../formats.js'
import { drawSparkline } from '../sparkline.js'

export const placeholder = `<span class="flex items-center justify-center text-sm font-bold text-cyan-100/30 h-6 w-6 rounded-full border-2 border-cyan-100/30">?</span>`

export function FlowCellRenders({ value }) {
  return value === null
    ? `<div class="text-right text-white/30">N/A</div>`
    : `<div class="text-right">${formatAssetVolume(value)}</div>`
}

export function AssetIconCellRenders(params) {
  const { assetIconUrl: url, chainIconUrl } = resolveAssetIcon(params.data.key)

  const assetImg = url
    ? `<img src="${url}" class="h-6 w-6 rounded-full bg-white border border-white" />`
    : placeholder

  const chainImg = chainIconUrl
    ? `<img src="${chainIconUrl}" class="absolute -top-1 -left-1 h-4 w-4 rounded-full border border-white bg-white" />`
    : ''

  const imgWrapper = `<div class="relative h-6 w-6">${assetImg}${chainImg}</div>`

  return `<div class="flex gap-2 items-center ${params.valueFormatted === 'N/A' ? 'text-white/30' : ''}">${imgWrapper}<span>${params.valueFormatted}</span></div>`
}

export function NetworkIconCellRenders(params) {
  const chain = {
    url: resolveNetworkIcon(params.value),
    name: resolveNetworkName(params.value) ?? params.value,
    id: params.value,
  }

  const imgIcon =
    chain.url && chain.url !== '#'
      ? `<img src="${chain.url}" class="h-6 w-6 rounded-full bg-white border border-white" />`
      : placeholder

  const href = `/network/index.html#${encodeURIComponent(chain.id)}`
  return `
    <a href="${href}" class="group flex gap-2 items-center">
      <div class="flex -space-x-2">${imgIcon}</div>
      <span class="truncate group-hover:text-white">${chain.name}</span>
      <div class="flex ml-auto text-white/20 group-hover:text-white/70">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-5">
        <path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
      </svg>
      </div>
    </a>
  `
}

export function NetFlowCellRenders(params) {
  const net = params.value
  return net === null
    ? `<div class="text-white/30 text-right">N/A</div>`
    : net === 0
      ? `<div class="text-right">${net}</div>`
      : `<div class="${net > 0 ? 'pct-positive' : 'pct-negative'} text-right">${net > 0 ? '+' : '-'}${formatAssetVolume(Math.abs(net))}</div>`
}

export function PercentageBarRenderer(params) {
  const value = Number(params.value)
  return value === NaN
    ? `<div class="text-white/30 text-right">N/A</div>`
    : `
    <div class="relative w-full h-full flex items-center justify-end text-sm overflow-hidden">
      <div class="absolute top-0 left-0 bottom-0 bg-[#669999]/20" style="width: ${value.toFixed(2)}%"></div>
      <span class="relative z-10 pr-1">${value.toFixed(2)}%</span>
    </div>
  `
}

export function isMobile() {
  return window.innerWidth < 800
}

export function SparklineCellRenderer(params) {
  const minPoints = 20
  const maxPoints = 30
  const values = params.value.map((v) => v.value)
  const totalPoints = values.length

  let dataPoints = []

  if (totalPoints <= maxPoints) {
    dataPoints = [...values]
    while (dataPoints.length < minPoints) {
      dataPoints.unshift(0)
    }
  } else {
    // Downsample by averaging
    const targetPoints = maxPoints
    const binSize = Math.round(totalPoints / targetPoints)
    for (let i = 0; i < targetPoints; i++) {
      const start = i * binSize
      const end = i === targetPoints - 1 ? totalPoints : (i + 1) * binSize
      const bin = values.slice(start, end)
      const avg = bin.reduce((sum, v) => sum + v, 0) / bin.length
      dataPoints.push(avg)
    }
  }

  return drawSparkline({
    dataset: {
      points: dataPoints.join(','),
      gap: '1',
      type: 'bar',
    },
  })
}

let loaded = false

export async function loadResources() {
  return loaded
    ? Promise.resolve()
    : loadExtraInfos().then(() => {
        loaded = true
      })
}

export const themeGrid = themeQuartz.withParams({
  backgroundColor: 'transparent',
  foregroundColor: 'rgba(255,255,255,0.8)',
  headerTextColor: 'rgba(255,255,255,0.5)',
  headerBackgroundColor: 'transparent',
  oddRowBackgroundColor: 'transparent',
  headerColumnResizeHandleColor: 'rgba(125,125,125,0.1)',
  wrapperBorder: false,
})

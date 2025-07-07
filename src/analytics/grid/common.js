import { themeQuartz } from 'ag-grid-community'

import {
  loadExtraInfos,
  resolveAssetIcon,
  resolveNetworkIcon,
  resolveNetworkName,
} from '../../extras.js'
import { formatAssetVolume } from '../../formats.js'
import { drawSparkline } from '../sparkline.js'

const placeholder = `<span class="flex items-center justify-center text-sm font-bold text-cyan-100/30 h-6 w-6 rounded-full border-2 border-cyan-100/30">?</span>`

export function FlowCellRenders({ value }) {
  return value === null
    ? `<div class="text-right text-white/30">N/A</div>`
    : `<div class="text-right">${formatAssetVolume(value)}</div>`
}

export function AssetIconCellRenders(params) {
  const { assetIconUrl: url, chainIconUrl } = resolveAssetIcon(params.data.key)

  const assetImg = url
    ? `<img src="${url}" class="h-6 w-6 rounded-full bg-white border border-white" />`
    : '<span class="flex items-center justify-center text-sm font-bold text-cyan-100/30 h-6 w-6 rounded-full border-2 border-cyan-100/30">?</span>'

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
    <a href="${href}" class="flex gap-2 items-center hover:underline">
      <div class="flex -space-x-2">${imgIcon}</div>
      <span class="truncate">${chain.name}</span>
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

export function isMobile() {
  return window.innerWidth < 800
}

function sliceMax(arr, maxElements) {
  return arr.length > maxElements ? arr.slice(-maxElements) : arr
}

export function SparklineCellRenderer(params) {
  const dataPoints = sliceMax(params.value, 25).map((v) => v.value)
  const minPoints = 20

  while (dataPoints.length < minPoints) {
    dataPoints.push(0)
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

import '../../style.css'

import {
  CellStyleModule,
  ClientSideRowModelModule,
  ColumnAutoSizeModule,
  ModuleRegistry,
  PaginationModule,
  PinnedRowModule,
  RowAutoHeightModule,
} from 'ag-grid-community'

ModuleRegistry.registerModules([
  PinnedRowModule,
  RowAutoHeightModule,
  PaginationModule,
  ClientSideRowModelModule,
  CellStyleModule,
  ColumnAutoSizeModule,
])

import { setupTimeSelector } from '../time-selector'
import { setupCounters } from '../indicators'
import { setupNetworkSeriesChart } from './chart'
import { resolveNetworkIcon, resolveNetworkName } from '../../extras'
import { loadExtraInfos } from '../../extras'
import { setupNetworkAssetsGrid } from './grid/assets'
import { setupNetworkChannelsGrid } from './grid/channels'

function setUpNetworkTitle(network) {
  const elements = document.querySelectorAll('[data-network-name]')
  const iconElements = document.querySelectorAll('[data-network-icon]')

  const networkName = resolveNetworkName(network)
  const networkIconUrl = resolveNetworkIcon(network)

  const imgIcon =
    networkIconUrl && networkIconUrl !== '#'
      ? `<img src="${networkIconUrl}" />`
      : null

  const imgHTML = `<div class="flex size-7">${imgIcon}</div>`
  const nameHTML = `<span class="text-white/80">${networkName}</span>`

  elements.forEach((element) => {
    element.innerHTML = `<div class="flex size-5">${imgIcon}</div>${nameHTML}`
  })
  iconElements.forEach((element) => {
    element.innerHTML =
      imgIcon !== null
        ? imgHTML
        : `<span class="flex items-center justify-center text-sm font-bold text-cyan-100/30 h-6 w-6 rounded-full border-2 border-cyan-100/30">${networkName[0]}</span>`
  })
}

function loadPage() {
  const selectId = window.location.hash.substring(1)
  const network = decodeURIComponent(selectId)

  loadExtraInfos().then(() => {
    setUpNetworkTitle(network)
    setupCounters(network)
    setupNetworkSeriesChart(document.querySelector('#chart'), network)
    setupNetworkAssetsGrid(document.querySelector('#grid-assets'), network)
    setupNetworkChannelsGrid(document.querySelector('#grid-channels'), network)
    setupTimeSelector(document.querySelector('#select-time'), 'monthly')
  })
}

window.onload = loadPage

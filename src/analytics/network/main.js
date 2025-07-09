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
import { placeholder } from '../grid/common'

function setUpNetworkTitle(network) {
  const elements = document.querySelectorAll('[data-network-name]')
  const iconElements = document.querySelectorAll('[data-network-icon]')

  const networkName = resolveNetworkName(network)
  const networkIconUrl = resolveNetworkIcon(network)

  const imgIcon =
    networkIconUrl && networkIconUrl !== '#'
      ? `<img src="${networkIconUrl}" />`
      : null

  const nameHTML = `<span class="text-white/80">${networkName}</span>`

  elements.forEach((element) => {
    element.innerHTML =
      imgIcon == null
        ? nameHTML
        : `<div class="flex size-5">${imgIcon}</div>${nameHTML}`
  })
  iconElements.forEach((element) => {
    element.innerHTML =
      imgIcon !== null
        ? `<div class="flex size-7">${imgIcon}</div>`
        : placeholder
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

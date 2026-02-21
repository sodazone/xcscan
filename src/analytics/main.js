import '../style.css'

import {
  CellStyleModule,
  ClientSideRowModelModule,
  ColumnAutoSizeModule,
  ModuleRegistry,
  PaginationModule,
  PinnedRowModule,
  RowAutoHeightModule,
  TooltipModule,
  ValidationModule,
} from 'ag-grid-community'

ModuleRegistry.registerModules([
  PinnedRowModule,
  RowAutoHeightModule,
  PaginationModule,
  ClientSideRowModelModule,
  CellStyleModule,
  ColumnAutoSizeModule,
  TooltipModule,
  ValidationModule,
])

import { setupSeriesChart } from './chart.js'
import { setupAssetsGrid } from './grid/assets.js'
import { setupChannelsGrid } from './grid/channels.js'
import { setupNetworksGrid } from './grid/networks.js'
import { setupCounters } from './indicators.js'
import { setupTimeSelector } from './time-selector.js'
import { setupSeriesSelector } from './series-selector.js'
import { setupProtocolsGrid } from './grid/protocols.js'
import { hasLocalStorage } from '../explorer/common.js'

// TODO: improve wiring on part loaded events (if needed)
function setupSekeletons() {
  const countersContainer = document.getElementById('counters')

  const skeletonHTML = `
  <div class="flex animate-pulse space-x-4 h-15 bg-linear-to-r from-white/10 to-transparent"></div>
`

  function showSkeletons() {
    const counters = countersContainer.querySelectorAll(
      'div.flex.flex-col.gap-1'
    )
    counters.forEach((counter) => {
      counter.innerHTML = skeletonHTML
    })
  }
  window.addEventListener('timeChanged', (e) => {
    showSkeletons()
  })
}

function setupBanner() {
  const cacheKey = 'close-banner'
  const banner = document.getElementById('crosschain-banner')
  const closeBtn = document.getElementById('close-banner')

  if (hasLocalStorage) {
    const alreadyClosed = localStorage.getItem(cacheKey)
    if (!alreadyClosed) {
      banner.classList.remove('hidden')
      banner.classList.add('flex')
    }
  }

  closeBtn.addEventListener('click', () => {
    banner.classList.add('hidden')
    if (hasLocalStorage) {
      localStorage.setItem(cacheKey, true)
    }
  })
}

window.onload = () => {
  setupSekeletons()

  // Temporary banner
  setupBanner()

  setupSeriesChart(document.querySelector('#chart'))
  setupAssetsGrid(document.querySelector('#grid-assets'))
  setupChannelsGrid(document.querySelector('#grid-channels'))
  setupNetworksGrid(document.querySelector('#grid-networks'))
  setupProtocolsGrid(document.querySelector('#grid-protocols'))
  setupCounters()
  setupTimeSelector(document.querySelector('#select-time'), 'monthly')
  setupSeriesSelector(document.querySelector('#select-series-type'), 'volume')
}

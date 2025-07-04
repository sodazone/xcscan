import '../../style.css'

import { setupTimeSelector } from '../time-selector'
import { setupCounters } from '../indicators'
import { setupNetworkSeriesChart } from './chart'
import { setupDropdownSelector } from './dropdown-selector'
import { resolveNetworkIcon, resolveNetworkName } from '../../extras'
import { loadExtraInfos } from '../../extras'
import { setupNetworkAssetsGrid } from './grid/assets'

function setUpNetworkTitle(network) {
  const element = document.querySelector('#network-title')

  const networkName = resolveNetworkName(network)
  const networkIconUrl = resolveNetworkIcon(network)

  const imgIcon =
    networkIconUrl && networkIconUrl !== '#'
      ? `<img src="${networkIconUrl}" class="h-7 w-7 rounded-full bg-white border border-white" />`
      : null

  element.innerHTML = `${imgIcon !== null ? `<div class="flex -space-x-2">${imgIcon}</div>` : ''}<span class="text-white/75 text-xl font-medium">${networkName} Crosschain Statistics</span>`
}

window.onload = async () => {
  const selectId = window.location.hash.substring(1)
  const network = decodeURIComponent(selectId)

  loadExtraInfos().then(() => {
    setUpNetworkTitle(network)
    setupCounters(network)
    setupNetworkSeriesChart(document.querySelector('#chart'), network)
    setupNetworkAssetsGrid(document.querySelector('#grid-assets'), network)
    setupTimeSelector(document.querySelector('#select-time'), 'daily')
    setupDropdownSelector(
      document.querySelector('#select-series-type'),
      document.querySelector('.current-type'),
      'seriesTypeChanged',
      'volume'
    )
    setupDropdownSelector(
      document.querySelector('#select-network-assets-type'),
      document.querySelector('.network-assets-current-type'),
      'networkAssetsTypeChanged',
      'volume'
    )
  })
}

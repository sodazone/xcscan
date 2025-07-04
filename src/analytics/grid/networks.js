import { createGrid } from 'ag-grid-community'

import { resolveNetworkIcon, resolveNetworkName } from '../../extras.js'
import { formatAssetVolume } from '../../formats.js'
import { getTransfersByNetwork } from '../api.js'
import {
  FlowCellRenders,
  isMobile,
  loadResources,
  themeGrid,
} from './common.js'

const placeholder = `<span class="flex items-center justify-center text-sm font-bold text-cyan-100/30 h-6 w-6 rounded-full border-2 border-cyan-100/30">?</span>`

function ChannelIconCellRenders(params) {
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

function NetFlowCellRenders(params) {
  const net = params.value
  return net === 0
    ? `<div class="text-white/30">N/A</div>`
    : `<div class="${net > 0 ? 'pct-positive' : 'pct-negative'}">${net > 0 ? '+' : '-'}${formatAssetVolume(Math.abs(net))}</div>`
}

export function setupNetworksGrid(element) {
  let grid
  let data

  function install() {
    const gridOptions = {
      rowData: [],
      theme: themeGrid,
      suppressCellFocus: true,
      domLayout: 'autoHeight',
      paginationPageSize: 15,
      pagination: true,
      paginationPageSizeSelector: false,
      autoSizeStrategy: isMobile()
        ? {
            type: 'fitCellContents',
          }
        : {},
      defaultColDef: {
        flex: 1,
      },
      columnDefs: [
        {
          field: 'network',
          headerName: 'Network',
          pinned: 'left',
          suppressMovable: true,
          flex: 0,
          width: 300,
          valueFormatter: ({ value }) => value.name,
          cellRenderer: ChannelIconCellRenders,
        },
        {
          field: 'volumeUsd',
          headerName: 'Volume (USD)',
          type: 'numericColumn',
          cellRenderer: FlowCellRenders,
          sort: 'desc',
        },
        {
          field: 'volumeIn',
          headerName: 'Inflow (USD)',
          type: 'numericColumn',
          cellRenderer: FlowCellRenders,
        },
        {
          headerName: 'Outflow (USD)',
          type: 'numericColumn',
          field: 'volumeOut',
          cellRenderer: FlowCellRenders,
        },
        {
          headerName: 'Netflow (USD)',
          type: 'numericColumn',
          field: 'netFlow',
          cellRenderer: NetFlowCellRenders,
        },
      ],
      onRowClicked: (event) => {
        const networkId = event.data.network
        if (networkId) {
          window.location.href = `/network/index.html#${encodeURIComponent(networkId)}`
        }
      },
    }

    grid = createGrid(element, gridOptions)
  }

  function update(period) {
    loadResources().then(() => {
      getTransfersByNetwork(period).then((newData) => {
        data = newData
        grid.setGridOption('rowData', data)
      })
    })
  }

  install()

  window.addEventListener('timeChanged', (e) => {
    update(e.detail)
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

      grid.setGridOption('rowData', data)
    }
  })
}

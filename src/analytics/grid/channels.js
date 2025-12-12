import { createGrid } from 'ag-grid-community'

import { resolveNetworkIcon, resolveNetworkName } from '../../extras.js'
import { formatTxs } from '../../formats.js'
import { getTransfersByChannel } from '../api.js'
import {
  FlowCellRenders,
  PercentageBarRenderer,
  SparklineCellRenderer,
  isMobile,
  loadResources,
  placeholder,
  themeGrid,
} from './common.js'
import { installResizeHandler } from '../resize.js'

function ChannelIconCellRenders(params) {
  const chains = params.value.split('-')
  const from = {
    url: resolveNetworkIcon(chains[0]),
    name: resolveNetworkName(chains[0]) ?? chains[0],
  }
  const to = {
    url: resolveNetworkIcon(chains[1]),
    name: resolveNetworkName(chains[1]) ?? chains[1],
  }
  const imgFrom = from.url
    ? `<img src="${from.url}" class="h-6 w-6 rounded-full bg-white border border-white" />`
    : placeholder
  const imgTo = to.url
    ? `<img src="${to.url}" class="h-6 w-6 rounded-full bg-white border border-white" />`
    : placeholder

  return `<div class="flex gap-2 items-center"><div class="flex -space-x-2">${imgFrom}${imgTo}</div><span class="truncate">${from.name} / ${to.name}</span></div>`
}

export function setupChannelsGrid(element) {
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
          field: 'key',
          headerName: 'Channel',
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
          sortingOrder: ['desc', 'asc'],
          cellRenderer: FlowCellRenders,
        },
        {
          field: 'total',
          headerName: 'Transfers',
          type: 'numericColumn',
          sortingOrder: ['desc', 'asc'],
          valueFormatter: ({ value }) => formatTxs(value),
        },
        {
          headerName: 'Vol Share %',
          type: 'numericColumn',
          field: 'percentageVol',
          maxWidth: 150,
          minWidth: 150,
          cellRenderer: PercentageBarRenderer,
          sort: 'desc',
          sortingOrder: ['desc', 'asc'],
        },
        {
          headerName: 'Volume Trend',
          field: 'series',
          maxWidth: 150,
          minWidth: 150,
          sortable: false,
          valueFormatter: ({ value }) => value[value.length - 1],
          cellRenderer: SparklineCellRenderer,
        },
      ],
    }

    grid = createGrid(element, gridOptions)
  }

  function update(period) {
    loadResources().then(() => {
      getTransfersByChannel(period).then((newData) => {
        data = newData
        grid.setGridOption('rowData', data)
      })
    })
  }

  install()

  window.addEventListener('timeChanged', (e) => {
    update(e.detail)
  })

  installResizeHandler(() => {
    element.textContent = ''
    install()

    grid.setGridOption('rowData', data)
  })
}

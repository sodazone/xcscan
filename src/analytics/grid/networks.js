import { createGrid } from 'ag-grid-community'

import { getTransfersByNetwork } from '../api.js'
import {
  FlowCellRenders,
  NetworkIconCellRenders,
  NetFlowCellRenders,
  isMobile,
  loadResources,
  themeGrid,
} from './common.js'
import { installResizeHandler } from '../resize.js'

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
          suppressMovable: true,
          flex: 0,
          width: 280,
          valueFormatter: ({ value }) => value.name,
          cellRenderer: NetworkIconCellRenders,
        },
        {
          field: 'volumeUsd',
          headerName: 'Volume (USD)',
          type: 'numericColumn',
          cellRenderer: FlowCellRenders,
          sort: 'desc',
          sortingOrder: ['desc', 'asc'],
        },
        {
          field: 'volumeIn',
          headerName: 'Inflow (USD)',
          type: 'numericColumn',
          sortingOrder: ['desc', 'asc'],
          cellRenderer: FlowCellRenders,
        },
        {
          headerName: 'Outflow (USD)',
          type: 'numericColumn',
          field: 'volumeOut',
          sortingOrder: ['desc', 'asc'],
          cellRenderer: FlowCellRenders,
        },
        {
          headerName: 'Netflow (USD)',
          type: 'numericColumn',
          field: 'netflow',
          sortingOrder: ['desc', 'asc'],
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

  installResizeHandler(() => {
    element.textContent = ''
    install()

    grid.setGridOption('rowData', data)
  })
}

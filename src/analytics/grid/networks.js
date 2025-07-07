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
          cellRenderer: NetworkIconCellRenders,
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

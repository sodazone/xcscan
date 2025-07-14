import { createGrid } from 'ag-grid-community'

import { getNetworkChannelsSeries } from '../../api.js'
import {
  FlowCellRenders,
  SparklineCellRenderer,
  isMobile,
  themeGrid,
  NetworkIconCellRenders,
  NetFlowCellRenders,
} from '../../grid/common.js'
import { installResizeHandler } from '../../resize.js'

export function setupNetworkChannelsGrid(element, network) {
  let grid
  let data
  let currentTimeFrame
  let currentType = 'volume'

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
          width: 280,
          flex: 0,
          suppressMovable: true,
          valueFormatter: ({ value }) => (value === '' ? 'N/A' : value),
          cellRenderer: NetworkIconCellRenders,
        },
        {
          field: 'total',
          headerName: 'Total',
          type: 'numericColumn',
          sortingOrder: ['desc', 'asc'],
          cellRenderer: FlowCellRenders,
          sort: 'desc',
        },
        {
          field: 'inflow',
          headerName: 'Inflow',
          type: 'numericColumn',
          sortingOrder: ['desc', 'asc'],
          cellRenderer: FlowCellRenders,
        },
        {
          field: 'outflow',
          headerName: 'Outflow',
          type: 'numericColumn',
          sortingOrder: ['desc', 'asc'],
          cellRenderer: FlowCellRenders,
        },
        {
          field: 'netflow',
          headerName: 'Netflow',
          type: 'numericColumn',
          sortingOrder: ['desc', 'asc'],
          minWidth: 100,
          cellRenderer: NetFlowCellRenders,
        },
        {
          headerName: 'Trend',
          field: 'series',
          maxWidth: 150,
          minWidth: 150,
          sortable: false,
          valueFormatter: ({ value }) => value[value.length - 1],
          cellRenderer: SparklineCellRenderer,
        },
      ],
      onRowClicked: (event) => {
        const networkId = event.data.key
        if (networkId) {
          window.location.hash = encodeURIComponent(networkId)
          window.location.reload()
        }
      },
    }

    grid = createGrid(element, gridOptions)
  }

  function update(period, type) {
    currentType = type
    currentTimeFrame = period

    if (currentType === 'volume') {
      getNetworkChannelsSeries(period, network, 'usd').then((newData) => {
        data = newData
        grid.setGridOption('rowData', data)
      })
    } else {
      getNetworkChannelsSeries(period, network, 'tx').then((newData) => {
        data = newData
        grid.setGridOption('rowData', data)
      })
    }
  }

  install()

  window.addEventListener('timeChanged', (e) => {
    update(e.detail, currentType)
  })

  window.addEventListener('networkChannelsTypeChanged', (e) => {
    update(currentTimeFrame, e.detail)
  })

  installResizeHandler(() => {
    element.textContent = ''
    install()

    grid.setGridOption('rowData', data)
  })
}

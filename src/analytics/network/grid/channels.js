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
import { setupDropdownSelector } from '../dropdown-selector.js'

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
          cellRenderer: FlowCellRenders,
          sort: 'desc',
        },
        {
          field: 'inflow',
          headerName: 'Inflow',
          type: 'numericColumn',
          cellRenderer: FlowCellRenders,
        },
        {
          field: 'outflow',
          headerName: 'Outflow',
          type: 'numericColumn',
          cellRenderer: FlowCellRenders,
        },
        {
          field: 'netflow',
          headerName: 'Netflow',
          type: 'numericColumn',
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
          window.location.assign(
            `/network/index.html#${encodeURIComponent(networkId)}`
          )
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

  setupDropdownSelector(
    document.querySelector('#select-network-channels-type'),
    document.querySelector('.network-channels-current-type'),
    'networkChannelsTypeChanged',
    'volume'
  )

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

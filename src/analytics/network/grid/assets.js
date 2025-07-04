import { createGrid } from 'ag-grid-community'
import { ModuleRegistry } from 'ag-grid-community'
import { ClientSideRowModelModule, PaginationModule } from 'ag-grid-community'

import { getNetworkAssetsSeries } from '../../api.js'
import {
  FlowCellRenders,
  AssetIconCellRenders,
  SparklineCellRenderer,
  isMobile,
  themeGrid,
} from '../../grid/common.js'

ModuleRegistry.registerModules([ClientSideRowModelModule, PaginationModule])

export function setupNetworkAssetsGrid(element, network) {
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
          field: 'symbol',
          headerName: 'Asset',
          pinned: 'left',
          suppressMovable: true,
          valueFormatter: ({ value }) => (value === '' ? 'N/A' : value),
          cellRenderer: AssetIconCellRenders,
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
          cellRenderer: FlowCellRenders,
        },
        {
          headerName: 'Trend',
          field: 'series',
          maxWidth: 150,
          sortable: false,
          valueFormatter: ({ value }) => value[value.length - 1],
          cellRenderer: SparklineCellRenderer,
        },
      ],
    }

    grid = createGrid(element, gridOptions)
  }

  function update(period, type) {
    currentType = type
    currentTimeFrame = period

    if (currentType === 'volume') {
      getNetworkAssetsSeries(period, network, 'usd').then((newData) => {
        data = newData
        grid.setGridOption('rowData', data)
      })
    } else if (currentType === 'asset') {
      getNetworkAssetsSeries(period, network, 'asset').then((newData) => {
        data = newData
        grid.setGridOption('rowData', data)
      })
    } else {
      getNetworkAssetsSeries(period, network, 'tx').then((newData) => {
        data = newData
        grid.setGridOption('rowData', data)
      })
    }
  }

  install()

  window.addEventListener('timeChanged', (e) => {
    update(e.detail, currentType)
  })

  window.addEventListener('networkAssetsTypeChanged', (e) => {
    update(currentTimeFrame, e.detail)
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

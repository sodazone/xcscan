import { createGrid } from 'ag-grid-community'

import { getNetworkAssetsSeries } from '../../api.js'
import {
  FlowCellRenders,
  AssetIconCellRenders,
  SparklineCellRenderer,
  isMobile,
  themeGrid,
  NetFlowCellRenders,
} from '../../grid/common.js'
import { setupDropdownSelector } from '../dropdown-selector.js'
import { createFisColumn } from '../../grid/fis-column.js'
import { installResizeHandler } from '../../grid/resize.js'

export function setupNetworkAssetsGrid(element, network) {
  let grid
  let gridOptions
  let fisColumn
  let data
  let currentTimeFrame
  let currentType = 'volume'

  function install() {
    gridOptions = {
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
    }

    grid = createGrid(element, gridOptions)
    fisColumn = createFisColumn(
      grid,
      gridOptions,
      {
        totalKey: 'total',
        netflowKey: 'netflow',
      },
      network
    )
  }

  function update(period, type) {
    currentType = type
    currentTimeFrame = period
    fisColumn.show(type === 'volume')

    const fetchFn = {
      volume: () => getNetworkAssetsSeries(period, network, 'usd'),
      asset: () => getNetworkAssetsSeries(period, network, 'asset'),
      count: () => getNetworkAssetsSeries(period, network, 'tx'),
    }[type]

    fetchFn().then((newData) => {
      data = fisColumn.update(newData)
      grid.setGridOption('rowData', data)
    })
  }

  install()

  window.addEventListener('timeChanged', (e) => {
    update(e.detail, currentType)
  })

  window.addEventListener('networkAssetsTypeChanged', (e) => {
    update(currentTimeFrame, e.detail)
  })

  setupDropdownSelector(
    document.querySelector('#select-network-assets-type'),
    document.querySelector('.network-assets-current-type'),
    'networkAssetsTypeChanged',
    'volume'
  )

  installResizeHandler(() => {
    element.textContent = ''
    install()
    fisColumn.onResize()
    grid.setGridOption('rowData', data)
  })
}

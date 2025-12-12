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
import { installResizeHandler } from '../../resize.js'
import { TrendHeader } from './header.js'

export function setupNetworkAssetsGrid(element, network) {
  let grid
  let data
  let currentOpts = {
    type: 'volume',
    timeframe: null,
  }

  function install() {
    const gridOptions = {
      rowData: [],
      theme: themeGrid,
      suppressCellFocus: true,
      domLayout: 'autoHeight',
      paginationPageSize: 15,
      pagination: true,
      paginationPageSizeSelector: false,
      tooltipShowDelay: 0,
      tooltipHideDelay: 200,
      context: {
        eventName: 'networkAssetsTypeChanged',
        initialType: currentOpts.type,
        initialTimeframe: currentOpts.timeframe,
      },
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
          sortingOrder: ['desc', 'asc'],
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
          headerComponent: TrendHeader,
        },
      ],
    }

    grid = createGrid(element, gridOptions)
  }

  function update({ type, timeframe }) {
    currentOpts.type = type
    currentOpts.timeframe = timeframe

    const fetchFn = {
      volume: () => getNetworkAssetsSeries(timeframe, network, 'usd'),
      asset: () => getNetworkAssetsSeries(timeframe, network, 'asset'),
      count: () => getNetworkAssetsSeries(timeframe, network, 'tx'),
    }[type]

    fetchFn().then((newData) => {
      data = newData
      grid.setGridOption('rowData', data)
    })
  }

  install()

  window.addEventListener('timeChanged', (e) => {
    update({ ...currentOpts, timeframe: e.detail })
  })

  window.addEventListener('networkAssetsTypeChanged', (e) => {
    update({ ...currentOpts, type: e.detail })
  })

  installResizeHandler(() => {
    element.textContent = ''
    install()
    grid.setGridOption('rowData', data)
  })
}

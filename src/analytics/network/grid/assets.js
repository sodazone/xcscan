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
import { computeFIS, fsiCellRenderer } from '../../fis.js'

export function setupNetworkAssetsGrid(element, network) {
  let grid
  let gridOptions
  let data
  let currentTimeFrame
  let currentType = 'volume'
  let showDFI = true

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
  }

  function toggleColumn(enabled) {
    const baseDefs = gridOptions.columnDefs.filter((col) => col.field !== 'fis')

    if (enabled) {
      baseDefs.push({
        field: 'fis',
        headerName: 'Flow Impact Score',
        maxWidth: 180,
        valueFormatter: ({ value }) => value.dfi,
        cellRenderer: fsiCellRenderer,
      })
    }

    grid.setGridOption('columnDefs', baseDefs)
  }

  function update(period, type) {
    currentType = type
    currentTimeFrame = period
    showDFI = type === 'volume'

    const fetchFn = {
      volume: () => getNetworkAssetsSeries(period, network, 'usd'),
      asset: () => getNetworkAssetsSeries(period, network, 'asset'),
      count: () => getNetworkAssetsSeries(period, network, 'tx'),
    }[type]

    fetchFn().then((newData) => {
      data = showDFI ? computeFIS(newData, 'total', (row) => +(row.netflow / row.total).toFixed(2)) : newData

      // Toggle DFI column visibility
      toggleColumn(showDFI)

      // Update row data
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
      toggleColumn(showDFI)

      grid.setGridOption('rowData', data)
    }
  })
}

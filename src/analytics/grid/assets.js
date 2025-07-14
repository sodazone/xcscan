import { createGrid } from 'ag-grid-community'
import { formatTxs } from '../../formats.js'
import { getTransfersVolumeByAsset } from '../api.js'
import {
  FlowCellRenders,
  AssetIconCellRenders,
  SparklineCellRenderer,
  isMobile,
  loadResources,
  themeGrid,
  PercentageBarRenderer,
} from './common.js'

export function setupAssetsGrid(element) {
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
          field: 'symbol',
          headerName: 'Asset',
          pinned: 'left',
          suppressMovable: true,
          valueFormatter: ({ value }) => (value === '' ? 'N/A' : value),
          cellRenderer: AssetIconCellRenders,
        },
        {
          field: 'volumeUsd',
          headerName: 'Volume (USD)',
          type: 'numericColumn',
          sortingOrder: ['desc', 'asc'],
          cellRenderer: FlowCellRenders,
        },
        {
          field: 'volume',
          headerName: 'Volume (Asset)',
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
          sort: 'desc',
          sortingOrder: ['desc', 'asc'],
          cellRenderer: PercentageBarRenderer,
        },
        {
          headerName: 'Tx Share %',
          type: 'numericColumn',
          field: 'percentageTx',
          sortingOrder: ['desc', 'asc'],
          cellRenderer: PercentageBarRenderer,
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

  function update(period) {
    loadResources().then(() => {
      getTransfersVolumeByAsset(period).then((newData) => {
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

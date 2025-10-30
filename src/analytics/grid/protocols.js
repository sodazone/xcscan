import { createGrid } from 'ag-grid-community'

import { getTransfersByProtocol } from '../api.js'
import {
  FlowCellRenders,
  isMobile,
  loadResources,
  themeGrid,
} from './common.js'
import { installResizeHandler } from '../resize.js'
import { formatDuration } from '../../formats.js'
import { resolveProtocol } from '../../protocols.js'

export function setupProtocolsGrid(element) {
  let grid
  let data

  function install() {
    const gridOptions = {
      rowData: [],
      theme: themeGrid,
      suppressCellFocus: true,
      domLayout: 'autoHeight',
      pagination: true,
      paginationPageSize: 15,
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
          field: 'protocol',
          headerName: 'Protocol',
          suppressMovable: true,
          flex: 0,
          width: 280,
          cellRenderer: ({ value }) =>
            `<div class="flex items-center h-full">${resolveProtocol(value)}</div>`,
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
          field: 'count',
          headerName: 'Tx Count',
          type: 'numericColumn',
          sortingOrder: ['desc', 'asc'],
        },
        {
          field: 'accounts',
          headerName: 'Unique Accounts',
          type: 'numericColumn',
          sortingOrder: ['desc', 'asc'],
        },
        {
          field: 'avgTimeSpent',
          headerName: 'Avg Time',
          type: 'numericColumn',
          valueFormatter: ({ value }) => formatDuration(value),
          sortingOrder: ['desc', 'asc'],
        },
      ],
      onRowClicked: (event) => {
        const protocolId = event.data.protocol
        if (protocolId) {
          window.location.href = `/protocol/index.html#${encodeURIComponent(protocolId)}`
        }
      },
    }

    grid = createGrid(element, gridOptions)
  }

  function update(period) {
    loadResources().then(() => {
      getTransfersByProtocol(period).then((newData) => {
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

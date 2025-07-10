import { computeFIS, fsiCellRenderer } from '../fis'

export function createFisColumn(
  grid,
  gridOptions,
  { netflowKey = 'netflow', totalKey = 'total' }
) {
  let showDFI = true

  function toggleColumn() {
    const baseDefs = gridOptions.columnDefs.filter((col) => col.field !== 'fis')

    if (showDFI) {
      baseDefs.push({
        field: 'fis',
        headerName: 'Flow Impact Score',
        maxWidth: 180,
        valueFormatter: ({ value }) =>
          value?.fis?.score ?? -Number.MAX_SAFE_INTEGER,
        cellRenderer: fsiCellRenderer,
      })
    }

    grid.setGridOption('columnDefs', baseDefs)
  }

  return {
    show: (isShow) => {
      showDFI = isShow
      toggleColumn()
    },
    update: (newData) => {
      toggleColumn()
      return showDFI ? computeFIS(newData, { netflowKey, totalKey }) : newData
    },
    onResize: toggleColumn,
  }
}

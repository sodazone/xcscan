import { computeFIS, flowLabels } from '../fis'

function fsiCellRenderer({ data }) {
  const fisLabel = data.fis?.label
  if (fisLabel == null) {
    return ''
  }
  const label = flowLabels[fisLabel]
  return `<span class="truncate text-white/80">${label}</span>`
}

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
        headerName: 'Flow Impact Score',
        maxWidth: 180,
        sortingOrder: ['desc', null],
        valueGetter: ({ data }) => data?.fis?.score ?? null,
        comparator: (a, b) => (a ?? -Infinity) - (b ?? -Infinity),
        valueFormatter: ({ value }) =>
          typeof value === 'number' ? value.toFixed(2) : '',
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

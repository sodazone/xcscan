import { computeFIS, flowLabels } from '../fis'

const styles = {
  down_strong: 'bg-red-500/10 text-red-300',
  down_neutral: 'bg-red-400/10 text-red-300',
  out_strong: 'bg-orange-400/10 text-orange-300',

  up_strong: 'bg-green-500/10 text-green-300',
  in_strong: 'bg-emerald-500/10 text-emerald-300',
  in_neutral: 'bg-emerald-400/10 text-emerald-300',

  eq_strong: 'bg-slate-400/10 text-slate-300',
}

function fsiCellRenderer({ data }) {
  const flowKey = data?.fis?.label
  if (!flowKey) return ''

  const label = flowLabels[flowKey]
  const style = styles[flowKey]

  if (style) {
    return `<span class="inline-flex items-center rounded px-2 py-0.5 text-xs ${style}">
      ${label}
    </span>`
  }

  return `<span class="text-white/50 text-xs">${label}</span>`
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
        headerName: 'Flow Category',
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

import { computeFIS } from '../fis'

const styles = {
  down_strong: 'bg-red-600/15 text-red-400',
  down_neutral: 'bg-red-500/10 text-red-300',
  out_strong: 'bg-amber-500/10 text-amber-400',

  up_strong: 'bg-green-600/15 text-green-400',
  in_strong: 'bg-teal-500/10 text-teal-300',
  in_neutral: 'bg-teal-600/15 text-teal-400',

  eq_strong: 'bg-slate-600/10 text-slate-300',
}

const hotIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></svg>`
const outIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/></svg>`
const flowIcons = {
  up_strong: hotIcon,
  down_strong: outIcon,
}

const flowLabels = {
  up_strong: 'Strong Inflow',
  up_neutral: 'Increasing Activity',
  up_weak: 'Gradual Uptick',

  in_strong: 'High Inflow',
  in_neutral: 'Moderate Inflow',
  in_weak: 'Low Inflow',

  eq_strong: 'Stable Balance',
  eq_neutral: 'Stable Flow',
  eq_weak: 'Minimal Movement',

  out_strong: 'High Outflow',
  out_neutral: 'Moderate Outflow',
  out_weak: 'Low Outflow',

  down_strong: 'Strong Outflow',
  down_neutral: 'Sustained Outflow',
  down_weak: 'Minimal Outflow',
}

function fsiCellRenderer({ data }) {
  const flowKey = data?.fis?.label
  if (!flowKey) return ''

  const label = flowLabels[flowKey]
  const style = styles[flowKey] || 'text-white/60'
  const icon = flowIcons[flowKey]

  return `
  <span class="flex grow h-full items-center">
    <span class="inline-flex items-center space-x-1 rounded-full px-2 py-0.5 ${style}">
      ${icon ? `<span class="flex items-center w-4 h-4 text-inherit">${icon}</span>` : ''}
      <span class="inline-flex text-xs">
        ${label}
      </span>
    </span>
  </span>
  `
}

export function createFisColumn(
  grid,
  gridOptions,
  { netflowKey = 'netflow', totalKey = 'total' },
  network
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
      return showDFI
        ? computeFIS(newData, { netflowKey, totalKey }, network)
        : newData
    },
    onResize: toggleColumn,
  }
}

import { computeFIS } from '../fis'

const styles = {
  down_strong: 'bg-rose-600/15 text-rose-300',
  down_neutral: 'bg-amber-500/10 text-amber-300',
  out_strong: 'bg-amber-500/10 text-amber-300',

  up_strong: 'bg-lime-600/15 text-green-300',
  in_strong: 'bg-lime-600/15 text-green-300',

  up_neutral: 'bg-teal-800/15 text-teal-300',
  in_neutral: 'bg-teal-800/15 text-teal-300',

  eq_strong: 'bg-violet-600/10 text-violet-300',
}

const hotIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></svg>`
const outIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/></svg>`
const flowIcons = {
  up_strong: hotIcon,
  in_strong: hotIcon,
  down_strong: outIcon,
}

const flowLabels = {
  up_strong: 'High Influx',
  up_neutral: 'Moderate Influx',
  up_weak: 'Trickle In',
  rev_up_strong: 'Ecosystem Influx',
  rev_up_neutral: 'Circulating Capital',
  rev_up_weak: 'Low Circulation',

  in_strong: 'High Influx',
  in_neutral: 'Moderate Influx',
  in_weak: 'Trickle In',
  rev_in_strong: 'Ecosystem Influx',
  rev_in_neutral: 'Circulating Capital',
  rev_in_weak: 'Low Circulation',

  eq_strong: 'High Activity',
  eq_neutral: 'Bidirectional Flow',
  eq_weak: 'Quiet',
  rev_eq_strong: 'High Activity',
  rev_eq_neutral: 'Bidirectional Flow',
  rev_eq_weak: 'Low Circulation',

  out_strong: 'Moderate Outflow',
  out_neutral: 'Low Outflow',
  out_weak: 'Quiet',
  rev_out_strong: 'Reduced Circulation',
  rev_out_neutral: 'Low Withdrawal',
  rev_out_weak: 'Low Circulation',

  down_strong: 'Peak Outflow',
  down_neutral: 'Moderate Outflow',
  down_weak: 'Quiet',
  rev_down_strong: 'High Withdrawal',
  rev_down_neutral: 'Reduced Circulation',
  rev_down_weak: 'Low Circulation',
}

function fsiCellRenderer({ data }) {
  const flowKey = data?.fis?.label
  if (!flowKey) return ''

  const bareFlowLabel = flowKey.replace('rev_', '')
  const label = flowLabels[flowKey]
  const style = styles[bareFlowLabel] || 'text-white/60'
  const icon = flowIcons[bareFlowLabel]

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

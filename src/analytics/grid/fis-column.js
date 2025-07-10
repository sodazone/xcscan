import { computeFIS } from '../fis'

const styles = {
  down_strong: 'bg-red-500/10 text-red-300',
  down_neutral: 'bg-red-400/10 text-red-300',
  out_strong: 'bg-orange-400/10 text-orange-300',

  up_strong: 'bg-green-500/10 text-green-300',
  in_strong: 'bg-emerald-500/10 text-emerald-300',
  in_neutral: 'bg-emerald-400/10 text-emerald-300',

  eq_strong: 'bg-slate-400/10 text-slate-300',
}

const hotIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-80q-66 0-127.5-20.5T240-160l58-58q42 29 88 43.5t94 14.5q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480H80q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 155.5 31.5t127 86q54.5 54.5 86 127T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80ZM159-243l163-163 120 100 198-198v104h80v-240H480v80h104L438-414 318-514 117-313q11 23 19.5 37.5T159-243Zm321-237Z"/></svg>`

const flowIcons = {
  up_strong: hotIcon,
}

const flowLabels = {
  up_strong: 'Power Inflow',
  up_neutral: 'Strong Uptick',
  up_weak: 'Growing Demand',

  in_strong: 'High Demand',
  in_neutral: 'Moderate Inflow',
  in_weak: 'Subtle Interest',

  eq_strong: 'Balanced Flow',
  eq_neutral: 'Steady State',
  eq_weak: 'Calm Market',

  out_strong: 'Active Market',
  out_neutral: 'Light Outflow',
  out_weak: 'Calm Market',

  down_strong: 'Sustained Outflow',
  down_neutral: 'Moderate Outflow',
  down_weak: 'Calm Market',
}

function fsiCellRenderer({ data }) {
  const flowKey = data?.fis?.label
  if (!flowKey) return ''

  const label = flowLabels[flowKey]
  const style = styles[flowKey] || 'text-white/60'
  const icon = flowIcons[flowKey]

  return `
    <span class="inline-flex items-center space-x-0 rounded-full px-2 py-0.5 ${style}">
      ${icon ? `<span class="flex items-center w-5 h-5 text-inherit">${icon}</span>` : ''}
      <span class="inline-flex text-xs">
        ${label}
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

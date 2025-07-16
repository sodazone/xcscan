function withTs(m) {
  return { ...m, ts: Date.parse(m.time) / 1000 }
}

export const GLOBAL_MARKERS = [
  {
    time: '2025-06-26',
    label: 'GIGA Boost',
    tooltip: 'GIGAHydration campaign launch',
  },
  {
    time: '2025-07-01',
    label: 'GIGAETH',
    tooltip: 'Launch of GIGAETH token',
  },
  {
    time: '2025-06-03',
    label: 'vDOT Loan',
    tooltip: 'Bifrost vDOT liquidity loan start',
  },
  {
    time: '2025-06-01',
    label: 'wBTC',
    tooltip: 'Stellaswap adds ETH-wBTC bridge',
  },
].map(withTs)

export function createAvgLine(series) {
  const averageLine = series.createPriceLine({
    price: 0,
    color: 'rgba(180, 167, 214, 0.5)',
    lineWidth: 1,
    lineStyle: 1,
    axisLabelVisible: true,
    title: 'avg',
  })

  return {
    setData: (data) => {
      const average = data.reduce((sum, d) => sum + d.value, 0) / data.length
      averageLine.applyOptions({ price: average })
    },
  }
}

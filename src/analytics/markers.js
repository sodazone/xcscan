import { RichMarkerPlugin } from './plugins/rich-marker-plugin'

export function createMarkers(series, markerData) {
  function getPriceAtTime(data, ts) {
    return data.find((d) => d.time === ts)?.value ?? null
  }
  const plugin = new RichMarkerPlugin([])
  series.attachPrimitive(plugin)

  return {
    setData: (data) => {
      plugin.updateMarkers(
        markerData
          .map((m) => ({
            ...m,
            price: getPriceAtTime(data, m.ts),
          }))
          .filter((m) => m.price != null)
      )
    },
    getEventTooltips: (time) => {
      return markerData.filter((m) => m.ts === time && m.tooltip != null)
    },
  }
}

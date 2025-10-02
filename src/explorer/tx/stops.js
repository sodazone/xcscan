import { wormholeRenderer } from './stops/wormhole'
import { xcmRenderer } from './stops/xcm'

const RENDER = {
  xcm: xcmRenderer,
  wormhole: wormholeRenderer,
}

function toProtocol(stop) {
  if (['hrmp', 'ump', 'dmp', 'xcmp'].includes(stop.type)) {
    return 'xcm'
  }
  return stop.type
}

export function resolveStopRenderer(stop) {
  return (
    RENDER[toProtocol(stop)] ?? {
      stopSegment: () => document.createDocumentFragment(),
      stopDetails: () => document.createDocumentFragment(),
    }
  )
}

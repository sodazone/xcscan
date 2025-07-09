import { fetchWithRetry } from '../api.js'
import { httpUrl } from '../env.js'

const queryUrl = `${httpUrl}/query/xcm`

export const TIME_PERIODS = {
  quarterly: {
    label: 'Last 3 months',
    timeframe: '3 months',
    bucket: '1 days',
  },
  monthly: {
    label: 'Month to Date',
    timeframe: '1 months',
    bucket: '1 days',
  },
  weekly: {
    label: 'Week to Date',
    timeframe: '7 days',
    bucket: '6 hours',
  },
  daily: {
    label: 'Last 24 hours',
    timeframe: '1 days',
    bucket: '1 hours',
  },
}

const CACHE_EXPIRY_MS = 3_600_000

let hasStorage = null
function hasLocalStorage() {
  if (hasStorage !== null) {
    return hasStorage
  }

  try {
    const testKey = 'test'
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    hasStorage = true
  } catch {
    hasStorage = false
  }

  return hasStorage
}

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return String(obj)
  }

  if (Array.isArray(obj)) {
    return `_${obj.map(stableStringify).join('_')}`
  }

  const keys = Object.keys(obj).sort()
  return `_${keys.map((key) => `${key}-${stableStringify(obj[key])}`).join('_')}`
}

function getCacheKey(args) {
  const serialized = stableStringify(args)
  const safeKey = serialized.replace(/\s+/g, '_')
  return `xcsAnalyticsCache_${safeKey}`
}

function alignTime(originalTime, bucketSeconds) {
  // Align to the bucket size (e.g., 1 hour = 3600 seconds)
  return Math.floor(originalTime / bucketSeconds) * bucketSeconds
}

function getTimeRange(timeframe, bucket) {
  const timeframeMatch = timeframe.match(/(\d+)\s*(\w+)/)
  const bucketMatch = bucket.match(/(\d+)\s*(\w+)/)

  if (!timeframeMatch || !bucketMatch) throw new Error('Invalid format')

  const [_, timeframeValue, timeframeUnit] = timeframeMatch
  const [__, bucketValue, bucketUnit] = bucketMatch

  const unitToSeconds = {
    second: 1,
    seconds: 1,
    minute: 60,
    minutes: 60,
    hour: 3600,
    hours: 3600,
    day: 86400,
    days: 86400,
    week: 604800,
    weeks: 604800,
    months: 2592000,
  }

  const timeframeSeconds =
    Number(timeframeValue) * unitToSeconds[timeframeUnit.toLowerCase()]
  const bucketSeconds =
    Number(bucketValue) * unitToSeconds[bucketUnit.toLowerCase()]

  const nowTimestamp = Math.floor(Date.now() / 1000)
  const alignedStartTime = nowTimestamp - (nowTimestamp % bucketSeconds)

  // Fix: Adjust startTime to prevent extra bucket
  const startTime = alignedStartTime - timeframeSeconds + bucketSeconds
  const endTime = alignedStartTime

  const timestamps = []
  for (let t = startTime; t < endTime; t += bucketSeconds) {
    timestamps.push(t)
  }

  return { startTime, endTime, bucketSize: bucketSeconds, timestamps }
}

function fill(items, { timeframe, bucket }) {
  const range = getTimeRange(timeframe, bucket)
  const pointsByTime = {}

  // Align the timestamps for each item based on the bucket size
  for (const i of items) {
    const alignedTime = alignTime(i.time, range.bucketSize)
    pointsByTime[alignedTime] = i.value
  }

  // Fill missing timestamps with zero value
  for (const t of range.timestamps) {
    if (pointsByTime[t] === undefined) {
      pointsByTime[t] = 0
    }
  }

  // Convert pointsByTime back to an array of objects and sort them by time
  return Object.entries(pointsByTime)
    .map(([time, value]) => ({ time: Number(time), value }))
    .sort((a, b) => a.time - b.time)
}

async function _fetch(args) {
  if (hasLocalStorage()) {
    const cacheKey = getCacheKey(args)
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { timestamp, data } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_EXPIRY_MS) {
        return data
      }
    }

    const data = await fetchWithRetry(queryUrl, { args })
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ timestamp: Date.now(), data })
    )
    return data
  }
  return await fetchWithRetry(queryUrl, { args })
}

export async function getTransfersTotal(period, network) {
  try {
    const criteria = TIME_PERIODS[period]
    if (network !== undefined) {
      criteria.network = network
    }
    return await _fetch({
      op: 'transfers_total',
      criteria,
    })
  } catch (error) {
    console.error(error.message)
  }
}

export async function getTransfersCount(period) {
  try {
    const criteria = TIME_PERIODS[period]
    const r = await _fetch({
      op: 'transfers_count_series',
      criteria,
    })
    return {
      transfers: fill(r.items, criteria),
      volume: fill(
        r.items.map((i) => ({ time: i.time, value: i.volumeUsd })),
        criteria
      ),
    }
  } catch (error) {
    console.error(error.message)
  }
}

export async function getTransfersVolumeByAsset(period) {
  try {
    const opts = TIME_PERIODS[period]
    const criteria = opts.trend ? opts.trend : opts

    return (
      await _fetch({
        op: 'transfers_volume_by_asset_series',
        criteria,
      })
    ).items.map((item) => ({
      ...item,
      series: fill(item.series, criteria),
    }))
  } catch (error) {
    console.error(error.message)
  }
}

export async function getTransfersByChannel(period) {
  try {
    const opts = TIME_PERIODS[period]
    const criteria = opts.trend ? opts.trend : opts

    return (
      await _fetch({
        op: 'transfers_by_channel_series',
        criteria,
      })
    ).items.map((item) => ({
      ...item,
      series: fill(item.series, criteria),
    }))
  } catch (error) {
    console.error(error.message)
  }
}

export async function getTransfersByNetwork(period) {
  try {
    const opts = TIME_PERIODS[period]
    const criteria = opts.trend ? opts.trend : opts

    return (
      await _fetch({
        op: 'transfers_by_network',
        criteria,
      })
    ).items
  } catch (error) {
    console.error(error.message)
  }
}

export async function getTransfersByNetworkSeries(period, network) {
  try {
    const opts = TIME_PERIODS[period]
    const criteria = opts.trend ? opts.trend : opts
    criteria.network = network

    const { items } = await _fetch({
      op: 'transfers_series.by_network',
      criteria,
    })

    if (items.length === 0) {
      return {
        transfers: fill([], criteria),
        volume: fill([], criteria),
        share: fill([], criteria),
        flows: {
          in: fill([], criteria),
          out: fill([], criteria),
          net: fill([], criteria),
        },
      }
    }
    const { series } = items[0]

    return {
      transfers: fill(
        series.map((i) => ({ time: i.time, value: i.txCount })),
        criteria
      ),
      volume: fill(
        series.map((i) => ({ time: i.time, value: i.totalVolumeUsd })),
        criteria
      ),
      share: fill(
        series.map((i) => ({ time: i.time, value: i.sharePct })),
        criteria
      ),
      flows: {
        in: fill(
          series.map((i) => ({ time: i.time, value: i.inflowUsd })),
          criteria
        ),
        out: fill(
          series.map((i) => ({ time: i.time, value: i.outflowUsd })),
          criteria
        ),
        net: fill(
          series.map((i) => ({
            time: i.time,
            value: i.inflowUsd - i.outflowUsd,
          })),
          criteria
        ),
      },
    }
  } catch (error) {
    console.error(error.message)
  }
}

export async function getNetworkAssetsSeries(period, network, type = 'usd') {
  try {
    const opts = TIME_PERIODS[period]
    const criteria = opts.trend ? opts.trend : opts
    criteria.network = network

    const { items } = await _fetch({
      op: `transfers_assets_series.by_network.${type}`,
      criteria,
    })

    return items.map((item) => ({
      ...item,
      series: fill(item.series, criteria),
    }))
  } catch (error) {
    console.error(error.message)
  }
}

export async function getNetworkChannelsSeries(period, network, type = 'usd') {
  try {
    const opts = TIME_PERIODS[period]
    const criteria = opts.trend ? opts.trend : opts
    criteria.network = network

    const { items } = await _fetch({
      op: `transfers_channels_series.by_network.${type}`,
      criteria,
    })

    return items.map((item) => ({
      ...item,
      series: fill(item.series, criteria),
    }))
  } catch (error) {
    console.error(error.message)
  }
}

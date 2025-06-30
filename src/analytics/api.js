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
  return await fetchWithRetry(queryUrl, { args })
}

export async function getTransfersTotal(period) {
  try {
    const criteria = TIME_PERIODS[period]
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
    return fill(r.items, criteria)
  } catch (error) {
    console.error(error.message)
  }
}

export async function getTransfersVolume(period) {
  try {
    const criteria = TIME_PERIODS[period]
    const r = await _fetch({
      op: 'transfers_count_series',
      criteria,
    })
    const volSeries = r.items.map((i) => ({ time: i.time, value: i.volumeUsd }))
    return fill(volSeries, criteria)
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

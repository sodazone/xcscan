import { httpUrl, apiKey } from "./env.js";

const queryUrl = `${httpUrl}/query/xcm`;
const headers = Object.assign(
	{
		"Content-Type": "application/json",
	},
	apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
);

export const TIME_PERIODS = {
	monthly: {
		label: "Month to Date",
		timeframe: "1 months",
		bucket: "1 days",
	},
	weekly: {
		label: "Week to Date",
		timeframe: "7 days",
		bucket: "1 hours",
		trend: {
			timeframe: "7 days",
			bucket: "6 hours",
		},
	},
	daily: {
		label: "Last 24 hours",
		timeframe: "1 days",
		bucket: "1 hours",
	},
};

function timeToLocal(originalTime) {
	const d = new Date(originalTime * 1000);
	return (
		Date.UTC(
			d.getFullYear(),
			d.getMonth(),
			d.getDate(),
			d.getHours(),
			d.getMinutes(),
			d.getSeconds(),
			d.getMilliseconds(),
		) / 1000
	);
}

function getTimeRange(timeframe, bucket) {
	const timeframeMatch = timeframe.match(/(\d+)\s*(\w+)/);
	const bucketMatch = bucket.match(/(\d+)\s*(\w+)/);

	if (!timeframeMatch || !bucketMatch) throw new Error("Invalid format");

	const [_, timeframeValue, timeframeUnit] = timeframeMatch;
	const [__, bucketValue, bucketUnit] = bucketMatch;

	// Convert to seconds
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
	};

	const timeframeSeconds =
		Number(timeframeValue) * unitToSeconds[timeframeUnit.toLowerCase()];
	const bucketSeconds =
		Number(bucketValue) * unitToSeconds[bucketUnit.toLowerCase()];

	// Get current time and align it to the bucket size (e.g., 6 hours)
	const now = new Date();
	const nowTimestamp = Math.floor(now.getTime() / 1000); // Unix timestamp in seconds

	// Align the current time to the nearest bucket size
	const alignedStartTime = nowTimestamp - (nowTimestamp % bucketSeconds);
	const startTime = alignedStartTime - timeframeSeconds; // Adjust start time by the timeframe size

	const endTime = alignedStartTime; // End time is the aligned current time

	// Generate timestamps
	const timestamps = [];
	for (let t = startTime; t <= endTime; t += bucketSeconds) {
		timestamps.push(t);
	}

	return { startTime, endTime, bucketSize: bucketSeconds, timestamps };
}

function fill(items, { timeframe, bucket }) {
	const range = getTimeRange(timeframe, bucket);
	const pointsByTime = {};

	for (const i of items) {
		pointsByTime[timeToLocal(i.time)] = i.value;
	}

	for (const t of range.timestamps) {
		if (pointsByTime[t] === undefined) {
			pointsByTime[t] = 0;
		}
	}

	return Object.entries(pointsByTime)
		.map(([time, value]) => ({ time: Number(time), value }))
		.sort((a, b) => a.time - b.time);
}

async function _fetch(args) {
	const response = await fetch(queryUrl, {
		method: "POST",
		headers,
		body: JSON.stringify({
			args,
		}),
	});
	if (!response.ok) {
		throw new Error(`Response status: ${response.status}`);
	}

	return await response.json();
}

export async function getTransfersTotal(period) {
	try {
		const criteria = TIME_PERIODS[period];

		return await _fetch({
			op: "transfers_total",
			criteria,
		});
	} catch (error) {
		console.error(error.message);
	}
}

export async function getTransfersCount(period) {
	try {
		const criteria = TIME_PERIODS[period];

		return fill(
			(
				await _fetch({
					op: "transfers_count_series",
					criteria,
				})
			).items,
			criteria,
		);
	} catch (error) {
		console.error(error.message);
	}
}

export async function getTransfersVolumeByAsset(period) {
	try {
		const opts = TIME_PERIODS[period];
		const criteria = opts.trend ? opts.trend : opts;

		return (
			await _fetch({
				op: "transfers_volume_by_asset_series",
				criteria,
			})
		).items.map((item) => ({
			...item,
			series: fill(item.series, criteria),
		}));
	} catch (error) {
		console.error(error.message);
	}
}

export async function getTransfersByChannel(period) {
	try {
		const opts = TIME_PERIODS[period];
		const criteria = opts.trend ? opts.trend : opts;

		return (
			await _fetch({
				op: "transfers_by_channel_series",
				criteria,
			})
		).items.map((item) => ({
			...item,
			series: fill(item.series, criteria),
		}));
	} catch (error) {
		console.error(error.message);
	}
}

import { apiKey, httpUrl } from "../env.js";

const queryUrl = `${httpUrl}/query/xcm`;
const headers = Object.assign(
	{
		"Content-Type": "application/json",
	},
	apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
);

async function _fetch(args, pagination) {
	const response = await fetch(queryUrl, {
		method: "POST",
		headers,
		body: JSON.stringify({
			args,
			pagination,
		}),
	});
	if (!response.ok) {
		throw new Error(`Response status: ${response.status}`);
	}

	return await response.json();
}

function asCriteria(filters) {
	const {
		currentSearchTerm,
		selectedDestinations,
		selectedOrigins,
		selectedStatus,
	} = filters;

	const criteria = {};
	if (selectedDestinations && selectedDestinations.length > 0) {
		criteria.destinations = [...selectedDestinations];
	}
	if (selectedOrigins && selectedOrigins.length > 0) {
		criteria.origins = [...selectedOrigins];
	}
	if (selectedStatus != null) {
		criteria.status = selectedStatus;
	}
	if (currentSearchTerm != null) {
		const trimed = currentSearchTerm.trim();
		if (currentSearchTerm.length > 2 && currentSearchTerm.length < 100) {
			if (trimed.startsWith("0x")) {
				const len = (trimed.length - 2) / 2;
				if (len === 20) {
					criteria.address = trimed;
				} else if (len === 32) {
					criteria.txHash = trimed.toLowerCase();
				}
			} else {
				criteria.address = trimed;
			}
		}
	}
	return criteria;
}

export async function listJourneys({ filters, pagination }) {
	try {
		return await _fetch(
			{
				op: "journeys.list",
				criteria: asCriteria(filters),
			},
			{
				...pagination,
			},
		);
	} catch (error) {
		console.error(error.message);
	}
}

export async function getJourneyById(id) {
	try {
		return await _fetch({
			op: "journeys.by_id",
			criteria: {
				id: 1,
			},
		});
	} catch (error) {
		console.error(error.message);
	}
}

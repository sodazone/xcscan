import { createGrid } from "ag-grid-community";

import { getTransfersByChannel } from "../analytics.js";
import {
	isMobile,
	loadResources,
	SparklineCellRenderer,
	themeGrid,
} from "./common.js";
import { formatTxs } from "../formats.js";
import { resolveNetworkIcon, resolveNetworkName } from "../extras.js";

const placeholder = `<span class="flex items-center justify-center text-sm font-bold text-cyan-100/30 h-6 w-6 rounded-full border-2 border-cyan-100/30">?</span>`;

function ChannelIconCellRenders(params) {
	const chains = params.value.split("-");
	const from = {
		url: resolveNetworkIcon(chains[0]),
		name: resolveNetworkName(chains[0]) ?? chains[0],
	};
	const to = {
		url: resolveNetworkIcon(chains[1]),
		name: resolveNetworkName(chains[1]) ?? chains[1],
	};
	const imgFrom = from.url
		? `<img src="${from.url}" class="h-6 w-6 rounded-full bg-white border border-white" />`
		: placeholder;
	const imgTo = to.url
		? `<img src="${to.url}" class="h-6 w-6 rounded-full bg-white border border-white" />`
		: placeholder;

	return `<div class="flex gap-2 items-center"><div class="flex -space-x-2">${imgFrom}${imgTo}</div><span class="truncate">${from.name} / ${to.name}</span></div>`;
}

export function setupChannelsGrid(element) {
	const gridOptions = {
		rowData: [],
		theme: themeGrid,
		suppressCellFocus: true,
		domLayout: "autoHeight",
		paginationPageSize: 15,
		pagination: true,
		paginationPageSizeSelector: false,
		autoSizeStrategy: isMobile()
			? {
					type: "fitCellContents",
				}
			: {},
		defaultColDef: {
			flex: 1,
		},
		columnDefs: [
			{
				field: "key",
				headerName: "Channel",
				pinned: "left",
				suppressMovable: true,
				flex: 0,
				width: 300,
				cellRenderer: ChannelIconCellRenders,
			},
			{
				field: "total",
				headerName: "Transfers",
				type: "numericColumn",
				valueFormatter: ({ value }) => formatTxs(value),
			},
			{
				headerName: "Share %",
				type: "numericColumn",
				field: "percentage",
				valueFormatter: ({ value }) => {
					return Number(value).toFixed(2) + "%";
				},
			},
			{
				headerName: "Trend",
				field: "series",
				maxWidth: 150,
				sortable: false,
				cellRenderer: SparklineCellRenderer,
			},
		],
	};

	const grid = createGrid(element, gridOptions);

	function update(period) {
		loadResources().then(() => {
			getTransfersByChannel(period).then((data) => {
				grid.setGridOption("rowData", data);
			});
		});
	}

	window.addEventListener("timeChanged", function (e) {
		update(e.detail);
	});
}

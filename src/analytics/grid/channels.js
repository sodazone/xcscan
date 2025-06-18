import { createGrid } from "ag-grid-community";

import { resolveNetworkIcon, resolveNetworkName } from "../../extras.js";
import { formatTxs } from "../../formats.js";
import { getTransfersByChannel } from "../api.js";
import {
	FlowCellRenders,
	SparklineCellRenderer,
	isMobile,
	loadResources,
	themeGrid,
} from "./common.js";

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
	let grid;
	let data;

	function install() {
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
					valueFormatter: ({ value }) => value.name,
					cellRenderer: ChannelIconCellRenders,
				},
				{
					field: "volumeUsd",
					headerName: "Volume (USD)",
					type: "numericColumn",
					cellRenderer: FlowCellRenders,
				},
				{
					field: "total",
					headerName: "Transfers",
					type: "numericColumn",
					valueFormatter: ({ value }) => formatTxs(value),
				},
				{
					headerName: "Vol Share %",
					type: "numericColumn",
					field: "percentageVol",
					valueFormatter: ({ value }) => {
						return `${Number(value).toFixed(2)}%`;
					},
					sort: "desc",
				},
				{
					headerName: "Tx Share %",
					type: "numericColumn",
					field: "percentageTx",
					valueFormatter: ({ value }) => {
						return `${Number(value).toFixed(2)}%`;
					},
				},
				{
					headerName: "Trend",
					field: "series",
					maxWidth: 150,
					sortable: false,
					valueFormatter: ({ value }) => value[value.length - 1],
					cellRenderer: SparklineCellRenderer,
				},
			],
		};

		grid = createGrid(element, gridOptions);
	}

	function update(period) {
		loadResources().then(() => {
			getTransfersByChannel(period).then((newData) => {
				data = newData;
				grid.setGridOption("rowData", data);
			});
		});
	}

	install();

	window.addEventListener("timeChanged", (e) => {
		update(e.detail);
	});

	let w =
		window.innerWidth ||
		document.documentElement.clientWidth ||
		document.body.clientWidth;
	window.addEventListener("resize", () => {
		const nw =
			window.innerWidth ||
			document.documentElement.clientWidth ||
			document.body.clientWidth;
		if (w !== nw) {
			w = nw;
			element.textContent = "";
			install();

			grid.setGridOption("rowData", data);
		}
	});
}

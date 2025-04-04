import { createGrid } from "ag-grid-community";

import { getTransfersVolumeByAsset } from "../analytics.js";
import {
	isMobile,
	loadResources,
	SparklineCellRenderer,
	themeGrid,
} from "./common.js";
import { formatAssetVolume, formatTxs } from "../formats.js";
import { resolveAssetIcon } from "../extras.js";

function AssetIconCellRenders(params) {
	const url = resolveAssetIcon(params.data.key);
	const img = url
		? `<img src="${url}" class="h-6 w-6" />`
		: '<span class="flex items-center justify-center text-sm font-bold text-cyan-100/30 h-6 w-6 rounded-full border-2 border-cyan-100/30">?</span>';
	return `<div class="flex gap-2 items-center">${img}<span>${params.value}</span></div>`;
}

export function setupAssetsGrid(element) {
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
					field: "symbol",
					headerName: "Asset",
					pinned: "left",
					suppressMovable: true,
					valueFormatter: ({ value }) => value,
					cellRenderer: AssetIconCellRenders,
				},
				{
					field: "volume",
					headerName: "Volume (Asset)",
					type: "numericColumn",
					valueFormatter: ({ value }) => formatAssetVolume(value),
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
					valueFormatter: ({ value }) => value[value.length - 1],
					cellRenderer: SparklineCellRenderer,
				},
			],
		};

		grid = createGrid(element, gridOptions);
	}

	function update(period) {
		loadResources().then(() => {
			getTransfersVolumeByAsset(period).then((newData) => {
				data = newData;
				grid.setGridOption("rowData", data);
			});
		});
	}

	install();

	window.addEventListener("timeChanged", function (e) {
		update(e.detail);
	});

	window.addEventListener("resize", function () {
		element.textContent = "";
		install();

		grid.setGridOption("rowData", data);
	});
}

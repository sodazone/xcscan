import "./style.css";

import {
	CellStyleModule,
	ClientSideRowModelModule,
	ColumnAutoSizeModule,
	ModuleRegistry,
	PaginationModule,
	PinnedRowModule,
	RowAutoHeightModule,
} from "ag-grid-community";

ModuleRegistry.registerModules([
	PinnedRowModule,
	RowAutoHeightModule,
	PaginationModule,
	ClientSideRowModelModule,
	CellStyleModule,
	ColumnAutoSizeModule,
]);

import { setupSeriesChart } from "./chart.js";
import { setupAssetsGrid } from "./grid/assets.js";
import { setupChannelsGrid } from "./grid/channels.js";
import { setupNetworksGrid } from "./grid/networks.js";
import { setupCounters } from "./indicators.js";
import { setupTimeSelector } from "./time-selector.js";

window.onload = () => {
	setupSeriesChart(document.querySelector("#chart"));
	setupAssetsGrid(document.querySelector("#grid-assets"));
	setupChannelsGrid(document.querySelector("#grid-channels"));
	setupNetworksGrid(document.querySelector("#grid-networks"));
	setupCounters();
	setupTimeSelector(document.querySelector("#select-time"), "daily");
};

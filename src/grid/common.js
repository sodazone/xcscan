import { loadExtraInfos } from "../extras.js";
import { drawSparkline } from "../sparkline.js";

export function isMobile() {
	return window.outerWidth < 800;
}

function sliceMax(arr, maxElements) {
	return arr.length > maxElements ? arr.slice(-maxElements) : arr;
}

export function SparklineCellRenderer(params) {
	let dataPoints = sliceMax(params.value, 25).map((v) => v.value);
	const minPoints = 20;

	while (dataPoints.length < minPoints) {
		dataPoints.push(0);
	}
	
	return drawSparkline({
		dataset: {
			points: dataPoints
				.join(","),
			gap: "1",
			type: "bar",
		},
	});
}

let loaded = false;

export async function loadResources() {
	return loaded
		? Promise.resolve()
		: loadExtraInfos().then(() => {
				loaded = true;
			});
}

export const themeGrid = agGrid.themeQuartz.withParams({
	backgroundColor: "transparent",
	foregroundColor: "rgba(255,255,255,0.8)",
	headerTextColor: "rgba(255,255,255,0.5)",
	headerBackgroundColor: "transparent",
	oddRowBackgroundColor: "transparent",
	headerColumnResizeHandleColor: "rgba(125,125,125,0.1)",
	wrapperBorder: false,
});

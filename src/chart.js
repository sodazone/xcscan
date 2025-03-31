import { AreaSeries, createChart } from "lightweight-charts";

import { getTransfersCount } from "./analytics.js";

export function setupSeriesChart(element) {
	const chartOptions = {
		autoSize: true,
		handleScroll: false,
		handleScale: false,
		layout: {
			attributionLogo: false,
			textColor: "rgba(255,255,255,0.5)",
			background: { color: "transparent" },
		},
		grid: {
			vertLines: {
				visible: false,
			},
			horzLines: {
				visible: true,
				style: 0,
				color: "rgba(255,255,255,0.05)",
			},
		},
		crosshair: {
			horzLine: {
				visible: false,
				labelVisible: false,
			},
			vertLine: {
				labelVisible: false,
				visible: false,
			},
		},
		rightPriceScale: {
			borderVisible: false,
		},
		localization: {
			priceFormatter: (p) => p.toFixed(0),
		},
	};
	const chart = createChart(element, chartOptions);
	const series = chart.addSeries(AreaSeries, {
		lastValueVisible: false,
		crosshairMarkerVisible: true,
		priceLineVisible: false,
		lineColor: "#669999",
		topColor: "rgba(102,153,153, 0.25)",
		bottomColor: "transparent",
		lineWidth: 1.5,
		priceFormat: {
			type: "price",
			precision: 0,
		},
	});

	chart.timeScale().applyOptions({
		borderColor: "transparent",
		timeVisible: true,
		secondsVisible: false,
	});

	const toolTipWidth = 80;
	const toolTipHeight = 80;
	const toolTipMargin = 15;

	// Create and style the tooltip html element
	const toolTip = document.createElement("div");
	toolTip.className = "chart-series-tooltip";
	element.appendChild(toolTip);

	// update tooltip
	chart.subscribeCrosshairMove((param) => {
		if (
			param.point === undefined ||
			!param.time ||
			param.point.x < 0 ||
			param.point.x > element.clientWidth ||
			param.point.y < 0 ||
			param.point.y > element.clientHeight
		) {
			toolTip.style.display = "none";
		} else {
			const dateStr = new Date(param.time * 1000).toLocaleString();
			toolTip.style.display = "block";
			const data = param.seriesData.get(series);
			const price = data.value !== undefined ? data.value : data.close;
			toolTip.innerHTML = `
      <div class="flex flex-col gap-2">
        <div class="flex gap-1 items-end">
          <span class="text-white/80 text-xl font-medium">${Number(price).toFixed(0)}</span>
          <span class="text-white/50 text-sm">tx</span>
        </div>
        <div class="text-white/50 text-xs">
          ${dateStr}
        </div>
      </div>`;

			const y = param.point.y;
			let left = param.point.x + toolTipMargin;
			if (left > element.clientWidth - toolTipWidth) {
				left = param.point.x - toolTipMargin - toolTipWidth;
			}

			let top = y + toolTipMargin;
			if (top > element.clientHeight - toolTipHeight) {
				top = y - toolTipHeight - toolTipMargin;
			}
			toolTip.style.left = left + "px";
			toolTip.style.top = top + "px";
		}
	});

	function update(period) {
		getTransfersCount(period)
			.then((data) => {
				series.setData(data);
				chart.timeScale().fitContent();
			})
			.catch(console.error);
	}

	window.addEventListener("timeChanged", function (e) {
		update(e.detail);
	});
}

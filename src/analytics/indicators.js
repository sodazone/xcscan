import {
	formatAccounts,
	formatAssetVolume,
	formatRoundtrip,
	formatTxs,
} from "../formats.js";
import { getTransfersTotal } from "./analytics.js";

export function setupCounters() {
	const vol = document.querySelector("#volume-counter");
	const txn = document.querySelector("#tx-counter");
	const rtt = document.querySelector("#roundtrip-counter");
	const acc = document.querySelector("#accounts-counter");

	function render({
		title,
		element,
		diff,
		current,
		previous,
		unit,
		invertPct = false,
		format,
	}) {
		const pct = (diff / current) * 100.0;
		element.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="text-white/70 font-medium">${title}</span>
        <span class="h-fit w-fit text-sm ${(invertPct ? pct < 0 : pct > 0) ? "pct-positive" : "pct-negative"}">${pct > 0 ? "+" : ""}${pct.toFixed(2)}%</span>
      </div>
      <div id="tx-counter" class="flex flex-col gap-1">
        <div>
          <span class="text-white/80 text-4xl font-medium">${format ? format(current) : current}</span>
          <span class="text-white/50 text-md">${unit}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-white/50">Previous ${format ? format(previous) : previous} ${unit}</span>
          <span class="text-xs text-white/50">(${diff > 0 ? "+" : ""}${format(diff)}${unit ? ` ${unit}` : ""})</span>
        </div>
      </div>
      `;
	}

	function update(period) {
		getTransfersTotal(period)
			.then((result) => {
				const counters = result.items[0];
				render({
					title: "Volume",
					element: vol,
					current: counters.volumeUsd.current,
					previous: counters.volumeUsd.previous,
					diff: counters.volumeUsd.diff,
					unit: "usd",
					format: formatAssetVolume,
				});
				render({
					title: "Transfers",
					element: txn,
					current: counters.current,
					previous: counters.previous,
					diff: counters.diff,
					unit: "tx",
					format: formatTxs,
				});
				render({
					title: "Accounts",
					element: acc,
					current: counters.accounts.current,
					previous: counters.accounts.previous,
					diff: counters.accounts.diff,
					unit: "",
					format: formatAccounts,
				});
				render({
					title: "Avg. Time",
					element: rtt,
					current: Math.abs(counters.avgTimeSpent.current),
					previous: Math.abs(counters.avgTimeSpent.previous),
					diff:
						Math.abs(counters.avgTimeSpent.current) -
						Math.abs(counters.avgTimeSpent.previous),
					unit: "s",
					invertPct: true,
					format: formatRoundtrip,
				});
			})
			.catch(console.error);
	}

	window.addEventListener("timeChanged", (e) => {
		update(e.detail);
	});
}

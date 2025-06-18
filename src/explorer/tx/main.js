import { resolveNetworkName } from "../../extras";
import { getJourneyById } from "../api.js";
import {
	decodeWellKnownAddress,
	formatAction,
	formatNetworkWithIcon,
	loadResources,
	shortenAddress,
} from "../common.js";
import { createXcmProgramViewer } from "./json.js";

function formatTimestamp(ts) {
	const date = new Date(ts);

	const hours = date.getUTCHours();
	const minutes = String(date.getUTCMinutes()).padStart(2, "0");
	const seconds = String(date.getUTCSeconds()).padStart(2, "0");

	const ampm = hours >= 12 ? "PM" : "AM";
	const hr12 = hours % 12 || 12;

	const time = `${hr12}:${minutes}:${seconds} ${ampm} UTC`;

	const day = String(date.getUTCDate()).padStart(2, "0");
	const month = date.toLocaleString("en-US", {
		month: "short",
		timeZone: "UTC",
	});
	const year = date.getUTCFullYear();

	const dateStr = `${day} ${month} ${year}`;

	return `
    <div class="flex flex-col text-sm text-white/80 leading-tight">
      <span class="font-medium text-white">${time}</span>
      <span class="text-white/50">${dateStr}</span>
    </div>`;
}

function formatStatusIcon(status) {
	const cls = status.toLowerCase();
	return `<img class="${cls} size-3" src="/icons/${cls}.svg" alt="${cls}" title="${status}" />`;
}

function formatStatus(status) {
	const cls = status.toLowerCase();
	return `<div class="status status-${cls}"><span class="status-bullet"></span><span class="status-label">${cls}</span></div>`;
}

function formatExtrinsic(ex) {
	if (!ex || !ex.module) return "";
	return `<div class="text-xs text-white/70">
    Extrinsic: <span class="font-medium">${ex.module}.${ex.method}</span>
  </div>`;
}

function formatEvent(ev) {
	if (!ev || !ev.module) return "";
	return `<div class="text-xs text-white/70">
    Event: <span class="font-medium">${ev.module}.${ev.name}</span>
  </div>`;
}

function formatStopPart(part) {
	if (part == null) {
		return "";
	}

	const block = part.blockNumber ? `Block #${part.blockNumber}` : "";
	const time = part.timestamp ? formatTimestamp(part.timestamp) : "";
	const extrinsic = formatExtrinsic(part.extrinsic);
	const event = formatEvent(part.event);
	const statusIcon = part.status ? formatStatusIcon(part.status) : "";
	return `
    <div class="bg-white/5 rounded-xl p-4 space-y-4 h-full ${block === "" ? "opacity-60" : ""}">
      <div class="flex items-center justify-between text-sm text-white/70">
        ${formatNetworkWithIcon(part.chainId)}
        ${statusIcon}
      </div>
      ${
				block === ""
					? `
<div class="flex items-center space-x-2 text-sm text-white/60">
  <span>in transit</span>
<svg class="inline w-5 h-5 text-white/60" viewBox="0 0 120 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <circle cx="15" cy="15" r="10">
    <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" begin="0s"/>
  </circle>
  <circle cx="60" cy="15" r="10">
    <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" begin="0.2s"/>
  </circle>
  <circle cx="105" cy="15" r="10">
    <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" begin="0.4s"/>
  </circle>
</svg>
</div>
`
					: `<div class="text-white font-mono text-sm">${block}</div>`
			}
      ${time}
      <div class="flex flex-col space-y-1">
      ${extrinsic}
      ${event}
      </div>
    </div>`;
}

function formatJourneyStop(stop, index) {
	const relay = formatStopPart(stop.relay);
	const from = formatStopPart(stop.from);
	const to = formatStopPart(stop.to);

	const fromName = stop.from?.chainId
		? resolveNetworkName(stop.from.chainId)
		: null;
	const toName = stop.to?.chainId ? resolveNetworkName(stop.to.chainId) : null;
	const relayName = stop.relay?.chainId
		? resolveNetworkName(stop.relay.chainId)
		: null;

	const arrow = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 text-white/20">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>`;
	const legLabel =
		[fromName, relayName, toName]
			.filter(Boolean)
			.map((l) => `<span>${l}</span>`)
			.join(arrow) || `Leg ${index + 1}`;

	const timeStart = stop.from?.timestamp ?? stop.relay?.timestamp;
	const timeEnd = stop.to?.timestamp;
	let elapsedText = "";

	if (timeStart && timeEnd) {
		const deltaSec = Math.floor((timeEnd - timeStart) / 1000);
		const minutes = Math.floor(deltaSec / 60);
		const seconds = deltaSec % 60;
		elapsedText = ` <span class="text-white/40 text-xs ml-auto">+${minutes}m ${seconds}s</span>`;
	}

	return `
    <div class="space-y-3">
      <div class="text-sm text-white/70 flex flex-wrap items-center space-x-2 font-semibold">
        <div class="flex space-x-2 items-center truncate">${legLabel}</div>
        ${elapsedText}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
        ${from}
        ${relay}
        ${to}
      </div>
    </div>`;
}

async function loadTransactionDetail() {
	try {
		const selectId = window.location.hash.substring(1);
		const { items } = await getJourneyById(selectId);

		if (items == null || items.length === 0) {
			throw new Error(`journey not found: ${selectId}`);
		}

		const journey = items[0];
		const container = document.querySelector(".transaction-detail");
		const amounts = journey.assets
			.map((a) =>
				a.decimals == null
					? ""
					: `<div>${a.amount / 10 ** a.decimals} ${a.symbol}</div>`,
			)
			.join("");

		const sentTime = journey.sentAt;
		const receivedTime = journey.recvAt;

		let timeDetails = "";
		if (sentTime) {
			const sentDate = new Date(sentTime);
			const receivedDate = receivedTime ? new Date(receivedTime) : null;

			const formattedSent = `${sentDate.toISOString().split("T").join(" ").split(".")[0]} UTC`;
			let formattedReceived = "";
			let elapsed = "";

			if (receivedDate) {
				formattedReceived = `${receivedDate.toISOString().split("T").join(" ").split(".")[0]} UTC`;
				const deltaSec = Math.floor((receivedDate - sentDate) / 1000);
				const min = Math.floor(deltaSec / 60);
				const sec = deltaSec % 60;
				elapsed = `(+${min}m ${sec}s)`;
			}

			timeDetails = `
      <div class="text-right text-white/50">Sent</div>
      <div>${formattedSent}</div>

      ${
				receivedDate
					? `
      <div class="text-right text-white/50">Received</div>
      <div>${formattedReceived} <span class="text-white/40">${elapsed}</span></div>
      `
					: ""
			}
    `;
		}

		const fromAddress = journey.from.startsWith("urn")
			? null
			: shortenAddress(journey.fromFormatted ?? journey.from);
		const toAddress = journey.to.startsWith("urn")
			? null
			: (decodeWellKnownAddress(journey.to) ??
				shortenAddress(journey.toFormatted ?? journey.to));

		const actionFormatted = formatAction(journey);

		const summary = document.createElement("div");
		summary.className = "bg-white/5 rounded-xl p-4 space-y-2";

		summary.innerHTML = `
  <div class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-4 text-sm text-white/80 pt-2">
    <div class="text-right text-white/50">ID</div>
    <div class="truncate" title="${journey.correlationId}">${journey.correlationId}</div>

    <div class="text-right text-white/50">Status</div>
    <div>${formatStatus(journey.status)}</div>

    <div class="text-right text-white/50">Action</div>
    <div class="truncate break-all">${actionFormatted}</div>

    ${timeDetails}

    <div class="text-right text-white/50">From</div>
    <div class="flex flex-col space-y-1">
       ${formatNetworkWithIcon(journey.origin)}
       ${fromAddress == null ? "" : `<div class="break-all">${fromAddress}</div>`}
    </div>

    <div class="text-right text-white/50">To</div>
        <div class="flex flex-col space-y-1">
       ${formatNetworkWithIcon(journey.destination)}
       ${toAddress == null ? "" : `<div class="break-all">${toAddress}</div>`}
    </div>

    ${
			amounts === ""
				? ""
				: `<div class="text-right text-white/50">Assets</div>
    <div class="flex flex-col space-y-1">${amounts}</div>`
		}
  </div>
`;

		const stopsHtml = journey.stops
			.map((stop, i) => formatJourneyStop(stop, i))
			.join("");
		const stopsContainer = document.createElement("div");
		stopsContainer.className = "my-8 space-y-6";
		stopsContainer.innerHTML = `
        <h2>Legs</h2>
        ${stopsHtml}
        `;

		const program = createXcmProgramViewer(journey);

		const breadcrumbs = document.createElement("div");
		breadcrumbs.className =
			"flex space-x-2 text-sm mb-4 items-center text-white/60";
		breadcrumbs.innerHTML = `
	  <a class="group flex space-x-2 items-center" href="/">	
		<div class="rounded-full bg-white/10 p-1 text-black/90 group-hover:bg-white/30">
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
			</svg>
		</div>
		<span class="group-hover:text-white">Transactions</span>
	  </a>
    `;

		container.appendChild(breadcrumbs);
		container.appendChild(summary);
		container.appendChild(stopsContainer);
		container.appendChild(program);
	} catch (err) {
		console.error("Error loading transaction:", err);
	}
}

window.onload = async () => {
	await loadResources();
	await loadTransactionDetail();
};

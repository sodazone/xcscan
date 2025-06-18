import { debounce } from "../utils.js";
import {
	decodeWellKnownAddress,
	formatAssetAmount,
	formatNetworkWithIcon,
	loadResources,
	prettify,
	shortenAddress,
} from "./common.js";
import { loadSearch } from "./search.js";

const pageCursors = [null];
let currentPage = 0;

// Dummy
let allData = [];
let filteredData = [];
const nextCursor = null;

const filters = {
	currentSearchTerm: "",
	selectedDestinations: [],
	selectedOrigins: [],
	selectedStatus: [],
};

function formatTimestamp(timestamp) {
	const date = new Date(timestamp);

	const yyyy = date.getUTCFullYear();
	const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
	const dd = String(date.getUTCDate()).padStart(2, "0");
	const hh = String(date.getUTCHours()).padStart(2, "0");
	const mi = String(date.getUTCMinutes()).padStart(2, "0");
	const ss = String(date.getUTCSeconds()).padStart(2, "0");

	return `
    <div class="flex flex-col space-y-1 leading-tight text-sm">
      <span class="text-white">${hh}:${mi}:${ss} UTC</span>
      <span class="text-white/60">${yyyy}-${mm}-${dd}</span>
    </div>
  `;
}

function renderPaginationFooter(hasNextPage) {
	const paginationFooter = document.querySelector("#pagination-footer");

	if (!paginationFooter) return;

	const prevButton = paginationFooter.querySelector("#prev-button");
	const nextButton = paginationFooter.querySelector("#next-button");
	const pageIndicator = paginationFooter.querySelector("#page-indicator");

	prevButton.disabled = currentPage === 0;
	nextButton.disabled = !hasNextPage;
	pageIndicator.textContent = `Page ${currentPage + 1}`;

	prevButton.onclick = () => {
		if (currentPage > 0) {
			currentPage--;
			renderCurrentPage();
		}
	};

	nextButton.onclick = () => {
		const pageSize = 10;
		const maxPages = Math.ceil(filteredData.length / pageSize);
		if (currentPage < maxPages - 1) {
			currentPage++;
			renderCurrentPage();
		}
	};
}

function renderTransactionsTable(data, pagination) {
	const container = document.querySelector(
		".transaction-table .transaction-table-body",
	);
	container.innerHTML = "";

	if (data.length === 0) {
		container.innerHTML = `
            <div class="text-center text-white/50 py-10 text-sm opacity-0 transition-opacity duration-500" id="no-results">
                No results found.
            </div>`;
		requestAnimationFrame(() => {
			document.querySelector("#no-results")?.classList.add("opacity-100");
		});
	}

	for (const entry of data) {
		const fromChain = entry.origin;
		const toChain = entry.destination;
		const fromAddress = entry.from.startsWith("urn")
			? null
			: shortenAddress(entry.fromFormatted ?? entry.from);
		const toAddress = entry.to.startsWith("urn")
			? null
			: (decodeWellKnownAddress(entry.to) ??
				shortenAddress(entry.toFormatted ?? entry.to));
		const time = formatTimestamp(entry.sentAt);

		const action = {
			type: entry.type,
		};
		if (entry.type === "transact" && entry.transactCalls?.length) {
			const call = entry.transactCalls[0];
			action.module = call.module;
			action.method = prettify(call.method);
		}

		const row = document.createElement("a");
		row.href = `/tx/index.html#${entry.correlationId}`;
		row.tabIndex = 0;
		row.className = "transaction-row";

		row.innerHTML = `
            <div class="cell flex md:items-center" data-label="Time">
             ${time}
            </div>
<div class="cell flex md:items-center" data-label="Action">
  ${
		action.module !== undefined
			? `
    <div class="flex flex-col space-y-0.5 text-sm text-white leading-tight tracking-wide break-words">
      <span class="text-white truncate">${action.module}</span>
      <span class="text-xs text-white/70 font-medium truncate">${action.method}</span>
    </div>
    `
			: `<div class="text-sm text-white tracking-wide capitalize">
    ${action.type}
  </div>`
	}
</div>
        <div class="cell flex md:items-center" data-label="From">
          <div class="flex flex-col space-y-1">
            ${formatNetworkWithIcon(fromChain)}
            ${fromAddress == null ? "" : `<div>${fromAddress}</div>`}
          </div>
        </div>
        <div class="cell flex md:items-center" data-label="To">
            <div class="flex flex-col space-y-1">
            ${formatNetworkWithIcon(toChain)}
            ${toAddress == null ? "" : `<div>${toAddress}</div>`}
            </div>
        </div>
        <div class="cell flex md:items-center ${Array.isArray(entry.assets) && entry.assets.length === 0 ? "sm-hidden" : ""}"
             data-label="Assets">
            <div class="flex flex-col space-y-1">
            ${
							Array.isArray(entry.assets) && entry.assets.length > 0
								? entry.assets
										.map((asset) => {
											if (asset.decimals !== null) {
												return `<div>${formatAssetAmount(asset)}</div>`;
											}
											return '<div class="text-white/20">-</div>';
										})
										.join("")
								: '<div class="text-white/20">-</div>'
						}
            </div>
        </div>
        <div class="cell flex md:justify-center md:items-center" data-label="Status" title="${entry.status}">
          <div class="flex space-x-2 items-center">
            <img class="table-status ${entry.status.toLowerCase()} size-4" src="/icons/${entry.status.toLowerCase()}.svg" alt="${entry.status.toLowerCase()}" />
            <span class="md:hidden capitalize text-white/60">${entry.status}</span>
          </div>
        </div>
      `;

		container.appendChild(row);
		requestAnimationFrame(() => {
			row.classList.add("fade-in");
		});
	}

	renderPaginationFooter(pagination.hasNextPage);
}

function applyFiltersAndRender() {
	const {
		currentSearchTerm,
		selectedDestinations,
		selectedOrigins,
		selectedStatus,
	} = filters;

	const searchTerm = currentSearchTerm.toLowerCase();

	filteredData = allData.filter((entry) => {
		if (selectedOrigins.length && !selectedOrigins.includes(entry.origin))
			return false;

		if (
			selectedDestinations.length &&
			!selectedDestinations.includes(entry.destination)
		)
			return false;

		if (
			selectedStatus.length &&
			!selectedStatus.includes(entry.status.toLowerCase())
		)
			return false;

		if (searchTerm) {
			const matchStr = `${entry.correlationId} ${entry.fromFormatted ?? entry.from} ${entry.toFormatted ?? entry.to}`;
			if (!matchStr.toLowerCase().includes(searchTerm)) return false;
		}

		return true;
	});

	currentPage = 0;
	pageCursors.length = 1;
	renderCurrentPage();
}

function renderCurrentPage() {
	const pageSize = 10;
	const start = currentPage * pageSize;
	const end = start + pageSize;

	const paginatedData = filteredData.slice(start, end);
	const hasNextPage = end < filteredData.length;

	renderTransactionsTable(paginatedData, {
		hasNextPage,
		cursor: currentPage + 1,
	});
}

async function loadTransactions() {
	try {
		const response = await fetch("/sample-1.json");
		allData = await response.json();

		applyFiltersAndRender();
	} catch (error) {
		console.error("Failed to load dummy data sample.json:", error);
	}
}

export function loadToggles() {
	const toggles = document.querySelectorAll("[data-toggle]");
	for (const toggle of toggles) {
		toggle.addEventListener("click", () => {
			const targetId = toggle.dataset.target;
			const target = document.getElementById(targetId);
			if (target) {
				target.classList.toggle("flex");
				target.classList.toggle("hidden");
			}
		});
	}
}

window.onload = async () => {
	await loadResources();

	loadToggles();
	loadSearch({
		filters,
		update: debounce(applyFiltersAndRender, 300),
	});
	await loadTransactions();
};

import { TIME_PERIODS } from "./api.js";

export function setupTimeSelector(element, initial = "daily") {
	let selected = initial;

	function update() {
		window.dispatchEvent(new CustomEvent("timeChanged", { detail: selected }));

		for (const child of element.children) {
			if (child.dataset.value === selected) {
				child.className = "bg-cyan-800/40 rounded text-cyan-200 p-1";
			} else {
				child.className =
					"text-cyan-200/40 p-1 cursor-pointer hover:text-cyan-200";
			}
		}

		for (const element of document.querySelectorAll(".current-period")) {
			element.innerHTML = TIME_PERIODS[selected].label;
		}
	}

	function handleTimeClick(e) {
		const selection = e.currentTarget.dataset.value;
		if (selection !== selected) {
			selected = e.currentTarget.dataset.value;
			update();
		}
	}

	for (const child of element.children) {
		child.onclick = handleTimeClick;
	}

	update();
}

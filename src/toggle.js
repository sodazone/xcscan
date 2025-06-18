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

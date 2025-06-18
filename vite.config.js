import fs from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import ejs from "ejs";
import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";

const renderPartial = (name, data) => {
	const filePath = path.resolve("partials", `${name}.html`);
	const template = fs.readFileSync(filePath, "utf-8");
	return ejs.render(template, data, { filename: filePath });
};

const buildPageData = (currentPage) => {
	const data = { currentPage };
	return {
		currentPage,
		head: renderPartial("head", data),
		header: renderPartial("header", data),
		footer: renderPartial("footer", data),
	};
};

export default defineConfig({
	build: {
		sourcemap: true,
		emptyOutDir: true,
		rollupOptions: {
			treeshake: "recommended",
			input: {
				home: "index.html",
				analytics: "analytics/index.html",
				tx: "tx/index.html",
			},
		},
	},
	plugins: [
		tailwindcss(),
		createHtmlPlugin({
			minify: false,
			pages: [
				{
					template: "index.html",
					filename: "index.html",
					injectOptions: { data: buildPageData("home") },
				},
				{
					template: "tx/index.html",
					filename: "tx/index.html",
					injectOptions: { data: buildPageData("tx") },
				},
				{
					template: "analytics/index.html",
					filename: "analytics/index.html",
					injectOptions: { data: buildPageData("analytics") },
				},
			],
		}),
	],
});

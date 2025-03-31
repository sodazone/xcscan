import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
//import Sonda from "sonda/vite";

export default defineConfig({
	build: {
		sourcemap: true,
		rollupOptions: {
			treeshake: "recommended",
		},
	},
	plugins: [
		tailwindcss(),
		//Sonda()
	],
});

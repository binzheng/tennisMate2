import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["./tests/setup.ts"],
		include: ["tests/**/*.{test,spec}.{ts,tsx}"],
		exclude: ["node_modules", "e2e", "**/e2e/**"],
		// 統合テストではデータベースを共有するため、並行実行を無効化
		pool: "forks",
		// @ts-expect-error - poolOptions.forks.singleFork is valid but not in the type definition
		poolOptions: {
			forks: {
				singleFork: true,
			},
		},
		// テストファイル間の並列実行を無効化
		fileParallelism: false,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"tests/helpers/",
				"e2e/",
				"**/*.config.{ts,js}",
				"**/generated/**",
			],
		},
	},
	resolve: {
		alias: {
			"~": path.resolve(__dirname, "./src"),
			"~/tests": path.resolve(__dirname, "./tests"),
		},
	},
});

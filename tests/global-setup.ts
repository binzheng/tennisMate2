import { execSync } from "node:child_process";

/**
 * Playwright Global Setup
 *
 * E2Eテストの実行前に自動的に実行されます。
 * データベースのクリーンアップとテストデータの投入を行います。
 */
async function globalSetup() {
	console.log("\n🚀 Playwright Global Setup: E2Eテスト環境を準備中...\n");

	try {
		// tsxを使ってセットアップスクリプトを別プロセスで実行
		execSync("npx tsx scripts/setup-e2e-db.ts", {
			stdio: "inherit",
			env: process.env,
		});
		console.log("\n✅ Global Setup完了: テスト環境の準備が整いました\n");
	} catch (error) {
		console.error("\n❌ Global Setupに失敗しました:", error);
		throw error;
	}
}

export default globalSetup;

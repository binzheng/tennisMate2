// Conditionally load jest-dom only when a DOM is available (jsdom environment)
if (typeof window !== "undefined" && typeof document !== "undefined") {
  // @ts-expect-error - Dynamic import for conditional loading in DOM environment
  await import("@testing-library/jest-dom");
}
import { beforeAll, afterEach, afterAll } from "vitest";

// React Testing Libraryのクリーンアップ (DOM環境でのみ実行)
if (typeof window !== "undefined" && typeof document !== "undefined") {
  const { cleanup } = await import("@testing-library/react");
  afterEach(() => {
    cleanup();
  });
}

// 環境変数のモック
beforeAll(() => {
	const testDbUrl =
		process.env.DATABASE_URL_TEST ||
		"postgresql://postgres:password@localhost:5432/tennis_mate_2_test";
	// 明示的に両方を揃える（リポジトリやPrismaClientの分岐があっても安定）
	process.env.DATABASE_URL_TEST = testDbUrl;
	process.env.DATABASE_URL = testDbUrl;
	process.env.NEXTAUTH_URL = "http://localhost:3000";
	process.env.NEXTAUTH_SECRET = "test-secret";
});

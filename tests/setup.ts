// Conditionally load jest-dom only when a DOM is available (jsdom environment)
if (typeof window !== "undefined" && typeof document !== "undefined") {
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
	process.env.DATABASE_URL =
		process.env.DATABASE_URL_TEST ||
		"postgresql://postgres:password@localhost:5432/tennis_mate_2_test";
	process.env.NEXTAUTH_URL = "http://localhost:3000";
	process.env.NEXTAUTH_SECRET = "test-secret";
});

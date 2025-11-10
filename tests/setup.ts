import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";

// React Testing Libraryのクリーンアップ
afterEach(() => {
	cleanup();
});

// 環境変数のモック
beforeAll(() => {
	process.env.DATABASE_URL =
		process.env.DATABASE_URL_TEST ||
		"postgresql://postgres:password@localhost:5432/tennis_mate_2_test";
	process.env.NEXTAUTH_URL = "http://localhost:3000";
	process.env.NEXTAUTH_SECRET = "test-secret";
});

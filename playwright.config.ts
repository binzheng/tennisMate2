import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT || 3000;
const baseURL = `http://localhost:${PORT}`;

// E2E timing knobs (env-overridable)
const TEST_TIMEOUT = Number(process.env.E2E_TEST_TIMEOUT_MS ?? 60_000);
const EXPECT_TIMEOUT = Number(process.env.E2E_EXPECT_TIMEOUT_MS ?? 7_000);
const ACTION_TIMEOUT = Number(process.env.E2E_ACTION_TIMEOUT_MS ?? 10_000);
const NAVIGATION_TIMEOUT = Number(
  process.env.E2E_NAVIGATION_TIMEOUT_MS ?? 20_000,
);
const SLOWMO_MS = Number(process.env.E2E_SLOWMO_MS ?? 0);

export default defineConfig({
	testDir: "tests/e2e",
	timeout: TEST_TIMEOUT,
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	expect: {
		timeout: EXPECT_TIMEOUT,
	},
	use: {
		baseURL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		locale: "ja-JP",
		timezoneId: "Asia/Tokyo",
		actionTimeout: ACTION_TIMEOUT,
		navigationTimeout: NAVIGATION_TIMEOUT,
		launchOptions: {
			slowMo: SLOWMO_MS,
		},
		extraHTTPHeaders: {
			"Accept-Language": "ja-JP,ja;q=0.9",
		},
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
		// {
		// 	name: "firefox",
		// 	use: { ...devices["Desktop Firefox"] },
		// },
		// {
		// 	name: "webkit",
		// 	use: { ...devices["Desktop Safari"] },
		// },
	],

	webServer: {
		command: "npm run dev",
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
});

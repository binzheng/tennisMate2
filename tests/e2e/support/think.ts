import type { Page } from "@playwright/test";

// Default think time in ms, overridable via env
const DEFAULT_THINK_MS = Number(process.env.E2E_THINK_MS ?? 0);

/**
 * Pause to simulate human "think time" between actions.
 * Enable globally with env E2E_THINK_MS, or pass explicit ms.
 */
export async function think(page: Page, ms: number = DEFAULT_THINK_MS) {
  if (ms > 0) {
    await page.waitForTimeout(ms);
  }
}


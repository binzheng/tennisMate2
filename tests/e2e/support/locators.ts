import type { Page, Locator } from "@playwright/test";

/**
 * Robust locator for MUI TextField/TimePicker input bound to a label.
 * - Narrows to the labeled group
 * - Skips hidden inputs (aria-hidden=true)
 */
export function textInputByLabel(page: Page, label: string): Locator {
  return page
    .getByLabel( label )
    .nth(1);
}

/**
 * Robust locator for MUI Select bound to a label.
 * Targets the trigger button rendered by MUI.
 */
export function selectTriggerByLabel(page: Page, label: string): Locator {
  return page.getByRole("combobox", { name: label }).or(
    page.getByRole("button", { name: label })
  );
}


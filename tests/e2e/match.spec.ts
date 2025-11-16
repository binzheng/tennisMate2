import { test, expect } from "@playwright/test";
import { textInputByLabel } from "./support/locators";

test.describe("ゲームマッチング（Match）", () => {
  test.beforeEach(async ({ page }) => {
    // ログイン（player 権限想定）
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill("player@example.com");
    await page.getByLabel("パスワード").fill("password123");
    await page.getByRole("button", { name: "ログイン" }).click();

    // ユーザー一覧へ遷移後、match 画面へ
    await page.waitForURL(/\/users/);
    await page.goto("/match");
    await expect(
      page.getByRole("heading", { name: "ゲームマッチング一覧" }),
    ).toBeVisible();
  });

  test("セッション一覧が表示され、新規作成画面に遷移できる", async ({ page }) => {
    await expect(page.getByRole("button", { name: "新規作成" })).toBeVisible();
    await page.getByRole("button", { name: "新規作成" }).click();

    await expect(
      page.getByRole("heading", { name: "新規マッチング作成" }),
    ).toBeVisible();
  });

  test("セッションを新規作成し一覧・詳細に反映される", async ({ page }) => {
    // 新規作成へ
    await page.getByRole("button", { name: "新規作成" }).click();
    await expect(
      page.getByRole("heading", { name: "新規マッチング作成" }),
    ).toBeVisible();

    // セッション名を上書きしておく
    const timestamp = Date.now();
    const sessionName = `E2Eセッション-${timestamp}`;
    const nameInput = page.getByLabel("セッション名");
    await nameInput.clear();
    await nameInput.fill(sessionName);

    // プレイヤー人数を4にし、「プレイヤー生成」
    const playerCountInput = page.getByLabel("プレイヤー人数");
    await playerCountInput.fill("");
    await playerCountInput.fill("4");
    await page.getByRole("button", { name: "プレイヤー生成" }).click();

    // 各プレイヤーに名前を入れる（既定のプレイヤー1..4でも良いが明示的に上書き）
    for (let i = 1; i <= 4; i++) {
      const field = page.getByLabel(`プレイヤー${i}`);
      await field.fill(`E2Eプレイヤー${i}`);
    }

    // 作成
    await page.getByRole("button", { name: "マッチング作成" }).click();

    // 詳細ページに遷移し、タイトルにセッション名が表示される
    await expect(page.getByRole("heading", { name: sessionName })).toBeVisible();

    // 一覧に戻ると、新しいセッションが表示されている
    await page.getByRole("button", { name: "戻る" }).click();
    await expect(page.getByText(sessionName)).toBeVisible();
  });

  test("スコアを入力すると勝利数が反映される", async ({ page }) => {
    // 新規作成から最小構成のセッションを作成
    await page.getByRole("button", { name: "新規作成" }).click();
    const timestamp = Date.now();
    const sessionName = `スコアテスト-${timestamp}`;
    await page.getByLabel("セッション名").fill(sessionName);

    const playerCountInput = page.getByLabel("プレイヤー人数");
    await playerCountInput.fill("");
    await playerCountInput.fill("4");
    await page.getByRole("button", { name: "プレイヤー生成" }).click();

    await page.getByRole("button", { name: "マッチング作成" }).click();
    await expect(
      page.getByRole("heading", { name: sessionName }),
    ).toBeVisible();

    // 最初のゲーム行を取得してスコアを設定
    const firstGameRow = page.locator("tbody tr").first();

    // スコア列（5列目）のセレクトボックスを取得
    // チーム1スコア（最初のセレクトボックス）とチーム2スコア（2番目のセレクトボックス）
    const scoreCell = firstGameRow.locator("td").nth(4); // "スコア"列
    const selects = scoreCell.getByRole("combobox");

    // チーム1のスコアを60に設定
    await selects.nth(0).click();
    await page.getByRole("option", { name: "60" }).click();

    // チーム2のスコアを30に設定
    await selects.nth(1).click();
    await page.getByRole("option", { name: "30" }).click();

    // 結果保存ボタンをクリック
    await firstGameRow.getByRole("button", { name: "保存" }).click();

    // 少し待機してデータが反映されるのを待つ
    await page.waitForTimeout(1000);

    // 勝利数小計に 1勝 が反映されることを確認
    await expect(
      page.getByText(/プレイヤー別 勝利数（小計）/),
    ).toBeVisible();
    await expect(page.getByText(/チーム1勝ち/)).toBeVisible();
  });

  test("セッションを削除できる", async ({ page }) => {
    // まずテスト用セッションを1件作成
    await page.getByRole("button", { name: "新規作成" }).click();
    const timestamp = Date.now();
    const sessionName = `削除用-${timestamp}`;
    await page.getByLabel("セッション名").fill(sessionName);
    const playerCountInput = page.getByLabel("プレイヤー人数");
    await playerCountInput.fill("");
    await playerCountInput.fill("4");
    await page.getByRole("button", { name: "プレイヤー生成" }).click();
    await page.getByRole("button", { name: "マッチング作成" }).click();

    // 詳細ページに遷移し、タイトルにセッション名が表示される
    await expect(page.getByRole("heading", { name: sessionName })).toBeVisible();

    await page.getByRole("button", { name: "戻る" }).click();

    const row = page
      .locator("tbody tr")
      .filter({ hasText: sessionName });
    await expect(row).toBeVisible({timeout: 30000});

    // 削除ボタンを押して確認ダイアログで削除
    await row.getByRole("button", { name: "削除" }).click();
    await expect(page.getByText(/セッションの削除/)).toBeVisible();
    await page.getByRole("button", { name: "削除" }).click();

    await expect(row).not.toBeVisible({ timeout: 10000 });
  });
});


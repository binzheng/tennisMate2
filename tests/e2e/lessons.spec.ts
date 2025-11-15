import { test, expect } from "@playwright/test";
import { textInputByLabel } from "./support/locators";

test.describe("レッスンマスタ", () => {
  test.beforeEach(async ({ page }) => {
    // ログイン
    await page.goto("/login");
    await page.getByLabel("メールアドレス").fill("admin@example.com");
    await page.getByLabel("パスワード").fill("password123");
    await page.getByRole("button", { name: "ログイン" }).click();

    // レッスン画面へ
    await page.waitForURL(/\/users/);
    await page.goto("/lessons");
    await expect(page.getByRole("heading", { name: "レッスンマスタ" })).toBeVisible();
  });

  test("一覧が表示され、新規作成ダイアログを開ける", async ({ page }) => {
    await expect(page.getByTitle("新規作成")).toBeVisible();
    await page.getByTitle("新規作成").click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("レッスン新規作成")).toBeVisible();
  });

  test("レッスンを作成・編集・削除できる", async ({ page }) => {
    // 新規作成
    await page.getByTitle("新規作成").click();
    await expect(page.getByText("レッスン新規作成")).toBeVisible();

    // コートはデフォルト選択（court1=コート1）。曜日のみ変更しておく
    const youbi = page.getByLabel("曜日");
    await youbi.click();
    await page.getByRole("option", { name: "火曜日" }).click();

    // 定員を2に
    const cap = page.getByLabel("定員");
    await cap.fill("");
    await cap.fill("2");

    // 開始時刻はデフォルト09:00のまま、時間枠もデフォルト（1時間）
    await page.getByRole("button", { name: "作成" }).click();

    // ダイアログが閉じる、テーブルに反映
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });

    // 作成した行を確認（コート1/火曜日/09:00）
    const row = page.locator("tr").filter({ hasText: "コート1" }).filter({ hasText: "火曜日" });
    await expect(row).toBeVisible();
    await expect(row).toContainText("09:00");
    await expect(row).toContainText("2");

    // 編集（定員を5に変更）
    await row.getByRole("button", { name: "編集" }).click();
    await expect(page.getByText("レッスン編集")).toBeVisible();
    const capEdit = page.getByLabel("定員");
    await capEdit.fill("");
    await capEdit.fill("5");
    await page.getByRole("button", { name: "更新" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });

    // 行の表示が更新されている
    await expect(row).toContainText("5");

    // 削除
    await row.getByRole("button", { name: "削除" }).click();
    await expect(page.getByText("このレッスンを削除してもよろしいですか?"))
      .toBeVisible();
    await page.getByRole("button", { name: "削除" }).click();

    // 行が消える
    await expect(row).not.toBeVisible({ timeout: 10000 });
  });

  test("バリデーションエラー: 定員が1未満だとエラー表示", async ({ page }) => {
    await page.getByTitle("新規作成").click();
    await expect(page.getByText("レッスン新規作成")).toBeVisible();

    const cap = page.getByLabel("定員");
    await cap.fill("");
    await cap.fill("0"); // 1未満

    await page.getByRole("button", { name: "作成" }).click();

    // Zodのエラーメッセージが表示され、ダイアログは閉じない
    await expect(
      page.getByText("定員は1以上である必要があります"),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toBeVisible();

    // キャンセルで閉じる
    await page.getByRole("button", { name: "キャンセル" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("重複エラー: 同一コート・同曜日で時間帯が重複するとエラー", async ({ page }) => {
    // 1件目: 月曜 09:00 60分
    await page.getByTitle("新規作成").click();
    await expect(page.getByText("レッスン新規作成")).toBeVisible();

    const cap = page.getByLabel("定員");
    await cap.fill("");
    await cap.fill("3"); 

    const start1 = textInputByLabel(page, '開始時刻');
    await start1.fill("");
    await start1.fill("09:00");

    // コートはデフォルト選択（court1=コート1）。曜日のみ変更しておく
    const youbi = page.getByLabel("曜日");
    await youbi.click();
    await page.getByRole("option", { name: "土曜日" }).click();

    // 曜日はデフォルトが月曜、時間枠も60、開始時刻は09:00のまま
    await page.getByRole("button", { name: "作成" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 30000 });

    // 2件目: 月曜 09:30 60分（重複する）
    await page.getByTitle("新規作成").click();
    await expect(page.getByText("レッスン新規作成")).toBeVisible();
    page.getByLabel("コート").click();

    // コートはデフォルト選択（court1=コート1）。曜日のみ変更しておく
    const youbi2 = page.getByLabel("曜日");
    await youbi2.click();
    await page.getByRole("option", { name: "土曜日" }).click();

    const start2 = textInputByLabel(page, '開始時刻');
    await start2.fill("");
    await start2.fill("09:30");
    await page.getByRole("button", { name: "作成" }).click();

    // エラーダイアログが表示される
    await expect(page.getByText("エラー")).toBeVisible();
    await expect(page.getByText(/重複しています/)).toBeVisible();

    // エラーダイアログを閉じ、作成ダイアログも閉じる
    await page.getByRole("button", { name: "閉じる" }).click();
    await page.getByRole("button", { name: "キャンセル" }).click();

    // 重複登録されていないこと（09:30 火曜ではなく月曜なので、月曜行の09:30は存在しない想定）
    const monday0930 = page
      .locator("tr")
      .filter({ hasText: "コート1" })
      .filter({ hasText: "月曜日" })
      .filter({ hasText: "09:30" });
    await expect(monday0930).toHaveCount(0);
  });

  test("削除キャンセル: 確認ダイアログでキャンセルすると削除されない", async ({ page }) => {
    // 1件作成
    await page.getByTitle("新規作成").click();
    // コートはデフォルト選択（court1=コート1）。曜日のみ変更しておく
    const youbi = page.getByLabel("曜日");
    await youbi.click();
    await page.getByRole("option", { name: "水曜日" }).click();

    // 定員を2に
    const cap = page.getByLabel("定員");
    await cap.fill("");
    await cap.fill("2");

    // 開始時刻はデフォルト09:00のまま、時間枠もデフォルト（1時間）
    await page.getByRole("button", { name: "作成" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 100000 });

    const row = page.locator("tr").filter({ hasText: "コート1" }).first();
    await expect(row).toBeVisible();

    // 削除→キャンセル
    await row.getByRole("button", { name: "削除" }).click();
    await expect(page.getByText("このレッスンを削除してもよろしいですか?"))
      .toBeVisible();
    await page.getByRole("button", { name: "キャンセル" }).click();

    // まだ行は存在する
    await expect(row).toBeVisible();
  });

  test("編集で重複させるとエラーが表示される", async ({ page }) => {
    // 1件目: 月曜 09:00 60分
    await page.getByTitle("新規作成").click();

    // コートはデフォルト選択（court1=コート1）。曜日のみ変更しておく
    const youbi = page.getByLabel("曜日");
    await youbi.click();
    await page.getByRole("option", { name: "木曜日" }).click();

    // 定員を2に
    const cap = page.getByLabel("定員");
    await cap.fill("");
    await cap.fill("2");

    await page.getByRole("button", { name: "作成" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 100000 });

    // 2件目: 月曜 10:00 60分（重複しない）
    await page.getByTitle("新規作成").click();
    // コートはデフォルト選択（court1=コート1）。曜日のみ変更しておく
    const youbi2 = page.getByLabel("曜日");
    await youbi2.click();
    await page.getByRole("option", { name: "木曜日" }).click();

    const start = textInputByLabel(page, '開始時刻');
    await start.fill("");
    await start.fill("10:00");
    await page.getByRole("button", { name: "作成" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 100000 });

    // 2件目の行を特定（10:00の行）
    const row10 = page
      .locator("tr")
      .filter({ hasText: "コート1" })
      .filter({ hasText: "木曜日" })
      .filter({ hasText: "10:00" })
      .first();
    await expect(row10).toBeVisible();

    // 編集して09:30に変更（1件目と重複）
    await row10.getByRole("button", { name: "編集" }).click();
    await expect(page.getByText("レッスン編集")).toBeVisible();
    const startEdit = textInputByLabel(page, "開始時刻");
    await startEdit.fill("");
    await startEdit.fill("09:30");
    await page.getByRole("button", { name: "更新" }).click();

    // エラーダイアログ
    await expect(page.getByText("エラー")).toBeVisible();
    await expect(page.getByText(/重複しています/)).toBeVisible();
    await page.getByRole("button", { name: "閉じる" }).click();
    await page.getByRole("button", { name: "キャンセル" }).click();
  });

  test("開始時刻の形式エラーでバリデーション表示", async ({ page }) => {
    await page.getByTitle("新規作成").click();
    await expect(page.getByText("レッスン新規作成")).toBeVisible();

    const start = textInputByLabel(page, "開始時刻");
    await start.fill("");
    await start.fill("25:00"); // 不正
    await page.getByRole("button", { name: "作成" }).click();

    await expect(page.getByText("HH:mm形式で入力してください")).toBeVisible();
    await page.getByRole("button", { name: "キャンセル" }).click();
  });
});

test.describe("認証が必要なページ(レッスン)", () => {
  test("未ログインは/lessonsへアクセスするとログインへリダイレクト", async ({ page }) => {
    await page.goto("/lessons");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Tennis Mate 2" })).toBeVisible();
  });

  // test("権限不足のユーザーは作成でエラー (player)", async ({ page }) => {
  //   // playerでログイン
  //   await page.goto("/login");
  //   await page.getByLabel("メールアドレス").fill("player@example.com");
  //   await page.getByLabel("パスワード").fill("password123");
  //   await page.getByRole("button", { name: "ログイン" }).click();

  //   await page.goto("/lessons");
  //   await expect(page.getByRole("heading", { name: "レッスンマスタ" })).toBeVisible();

  //   // 作成を試みる
  //   await page.getByTitle("新規作成").click();
  //   await page.getByRole("button", { name: "作成" }).click();

  //   // 権限エラー表示
  //   await expect(page.getByText("エラー")).toBeVisible();
  //   await expect(page.getByText("管理者権限が必要です")).toBeVisible();
  //   await page.getByRole("button", { name: "閉じる" }).click();
  // });
});

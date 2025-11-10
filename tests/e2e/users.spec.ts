import { test, expect } from "@playwright/test";
import { sleep } from "@trpc/server/unstable-core-do-not-import";

test.describe("ユーザーマスタ", () => {
	test.beforeEach(async ({ page }) => {
		// ログイン
		await page.goto("/login");
		await page.getByLabel("メールアドレス").fill("admin@example.com");
		await page.getByLabel("パスワード").fill("password123");
		await page.getByRole("button", { name: "ログイン" }).click();
		await page.waitForURL(/\/users/);
	});

	test("ユーザー一覧が表示される", async ({ page }) => {
		await expect(page.getByRole("heading", { name: "ユーザーマスタ" })).toBeVisible();
		await expect(page.getByRole("button", { name: "新規作成" })).toBeVisible();

		// テストユーザーが表示されることを確認
		await expect(page.getByText("admin@example.com")).toBeVisible();
	});

	test("新規ユーザー作成ダイアログを開ける", async ({ page }) => {
		await page.getByRole("button", { name: "新規作成" }).click();

		// ダイアログが表示されることを確認
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByText("ユーザー新規作成")).toBeVisible();
	});

	test("新規ユーザーを作成できる", async ({ page }) => {
		await page.getByRole("button", { name: "新規作成" }).click();

		// フォームに入力
		const timestamp = Date.now();
		await page.getByLabel("ユーザーID").fill(`newuser${timestamp}`);
		await page.getByLabel("名前").fill("New Test User");
		await page.getByLabel("メールアドレス").fill(`newuser${timestamp}@example.com`);
		await page.getByLabel("パスワード").fill("password123");

		// 保存ボタンをクリック
		await page.getByRole("button", { name: "作成" }).click();

		// ダイアログが閉じることを確認
		await expect(page.getByRole("dialog")).not.toBeVisible();

		// 新しいユーザーが一覧に表示されることを確認
		await expect(page.getByText(`newuser${timestamp}@example.com`)).toBeVisible();
	});

	test("バリデーションエラーが表示される", async ({ page }) => {
		await page.getByRole("button", { name: "新規作成" }).click();

		// パスワードが短い場合
		await page.getByLabel("ユーザーID").fill("testuser");
		await page.getByLabel("名前").fill("Test User");
		await page.getByLabel("メールアドレス").fill("test@example.com");
		await page.getByLabel("パスワード").fill("pass"); // 8文字未満

		await page.getByRole("button", { name: "作成" }).click();

		// エラーメッセージが表示されることを確認
		await expect(page.getByText(/8文字以上/)).toBeVisible();
	});

	test("ユーザー情報を編集できる", async ({ page }) => {
		// 編集ボタンをクリック（最初のユーザー）
		const firstEditButton = page.getByRole("button", { name: "編集" }).first();
		await firstEditButton.click();

		// ダイアログが表示されることを確認
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByText("ユーザー編集")).toBeVisible();

		await page.waitForTimeout(3000); // 1秒待機
		
		// 名前を変更
		const nameInput = page.getByLabel("名前");
		await nameInput.clear();
		await nameInput.fill("Updated User Name");

		// 保存ボタンをクリック
		await page.getByRole("button", { name: "更新" }).click();

		// ダイアログが閉じることを確認
		await expect(page.getByRole("dialog")).not.toBeVisible({timeout: 5000});

		// 更新された名前が表示されることを確認
		await expect(page.getByText("Updated User Name")).toBeVisible();

		// 削除ボタンをクリック
		const firstDeleteButton = page.getByRole("button", { name: "削除" }).first();
		await firstDeleteButton.click();

		// 確認ダイアログで削除を確認
		await page.getByRole("button", { name: "削除" }).click();
	});

	test("ユーザーを削除できる", async ({ page }) => {
		// まず新しいユーザーを作成（削除用）
		await page.getByRole("button", { name: "新規作成" }).click();

		const timestamp = Date.now();
		await page.getByLabel("ユーザーID").fill(`deleteuser${timestamp}`);
		await page.getByLabel("名前").fill("User to Delete");
		await page.getByLabel("メールアドレス").fill(`deleteuser${timestamp}@example.com`);
		await page.getByLabel("パスワード").fill("password123");

		await page.getByRole("button", { name: "作成" }).click();

		// 作成されたユーザーが表示されることを確認
		await expect(page.getByText(`deleteuser${timestamp}@example.com`)).toBeVisible();

		// 削除ボタンをクリック
		const row = page.locator(`tr:has-text("deleteuser${timestamp}@example.com")`);
		await row.getByRole("button", { name: "削除" }).click();

		// 確認ダイアログで削除を確認
		await page.getByRole("button", { name: "削除" }).click();

		// ユーザーが一覧から削除されることを確認
		await expect(page.getByText(`deleteuser${timestamp}@example.com`)).not.toBeVisible();
	});
});

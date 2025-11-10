import { test, expect } from "@playwright/test";

test.describe("ログイン機能", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/login");
	});

	test("ログインページが表示される", async ({ page }) => {
		await expect(page.getByRole("heading", { name: "Tennis Mate 2" })).toBeVisible();
		await expect(page.getByText("ログインしてください")).toBeVisible();
		await expect(page.getByLabel("メールアドレス")).toBeVisible();
		await expect(page.getByLabel("パスワード")).toBeVisible();
		await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
	});

	test("有効な認証情報でログインできる", async ({ page }) => {
		// テストユーザーの認証情報でログイン
		await page.getByLabel("メールアドレス").fill("admin@example.com");
		await page.getByLabel("パスワード").fill("password123");
		await page.getByRole("button", { name: "ログイン" }).click();

		// ユーザーマスタページにリダイレクトされることを確認
		await expect(page).toHaveURL(/\/users/);
		await expect(page.getByRole("heading", { name: "ユーザーマスタ" })).toBeVisible();
	});

	test("無効なメールアドレスでログインエラーが表示される", async ({ page }) => {
		await page.getByLabel("メールアドレス").fill("invalid@example.com");
		await page.getByLabel("パスワード").fill("password123");
		await page.getByRole("button", { name: "ログイン" }).click();

		// エラーメッセージが表示されることを確認
		await expect(page.getByText("メールアドレスまたはパスワードが正しくありません")).toBeVisible();

		// ログインページに留まることを確認
		await expect(page).toHaveURL(/\/login/);
	});

	test("無効なパスワードでログインエラーが表示される", async ({ page }) => {
		await page.getByLabel("メールアドレス").fill("admin@example.com");
		await page.getByLabel("パスワード").fill("wrongpassword");
		await page.getByRole("button", { name: "ログイン" }).click();

		// エラーメッセージが表示されることを確認
		await expect(page.getByText("メールアドレスまたはパスワードが正しくありません")).toBeVisible();
	});

	test("空のフォームで送信できない", async ({ page }) => {
		await page.getByRole("button", { name: "ログイン" }).click();

		// フォームのバリデーションにより、ページ遷移しないことを確認
		await expect(page).toHaveURL(/\/login/);
	});

	test("メールアドレスのみ入力してパスワードなしで送信できない", async ({ page }) => {
		await page.getByLabel("メールアドレス").fill("admin@example.com");
		await page.getByRole("button", { name: "ログイン" }).click();

		// フォームのバリデーションにより、ページ遷移しないことを確認
		await expect(page).toHaveURL(/\/login/);
	});
});

test.describe("認証が必要なページへのアクセス", () => {
	test("未ログイン状態でユーザーマスタにアクセスするとログインページにリダイレクトされる", async ({ page }) => {
		await page.goto("/users");

		// ログインページにリダイレクトされることを確認
		await expect(page).toHaveURL(/\/login/);
		await expect(page.getByRole("heading", { name: "Tennis Mate 2" })).toBeVisible();
	});

	test("ログイン後、元のページにリダイレクトされる", async ({ page }) => {
		// 未ログイン状態でユーザーマスタにアクセス
		await page.goto("/users");

		// ログインページにリダイレクトされる
		await expect(page).toHaveURL(/\/login.*callbackUrl/);

		// ログイン
		await page.getByLabel("メールアドレス").fill("admin@example.com");
		await page.getByLabel("パスワード").fill("password123");
		await page.getByRole("button", { name: "ログイン" }).click();

		// ユーザーマスタページにリダイレクトされることを確認
		await expect(page).toHaveURL(/\/users/);
	});
});

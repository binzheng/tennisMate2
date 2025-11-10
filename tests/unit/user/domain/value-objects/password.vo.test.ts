import { describe, it, expect } from "vitest";
import { Password } from "~/modules/user/domain/value-objects/password.vo";

describe("Password Value Object", () => {
	describe("createFromPlainText", () => {
		it("8文字以上のパスワードでPasswordオブジェクトを作成できる", async () => {
			const password = await Password.createFromPlainText("password123");

			expect(password).toBeInstanceOf(Password);
			expect(password.getValue()).toBeTruthy();
			expect(password.getValue()).not.toBe("password123"); // ハッシュ化されている
		});

		it("8文字未満のパスワードでエラーをスローする", async () => {
			await expect(Password.createFromPlainText("pass")).rejects.toThrow(
				"パスワードは8文字以上必要です",
			);
		});

		it("空文字列でエラーをスローする", async () => {
			await expect(Password.createFromPlainText("")).rejects.toThrow(
				"パスワードは8文字以上必要です",
			);
		});
	});

	describe("fromHash", () => {
		it("ハッシュ値からPasswordオブジェクトを作成できる", () => {
			const hash = "$2a$10$test.hash.value";
			const password = Password.fromHash(hash);

			expect(password).toBeInstanceOf(Password);
			expect(password.getValue()).toBe(hash);
		});
	});

	describe("compare", () => {
		it("正しいパスワードでtrueを返す", async () => {
			const plainPassword = "password123";
			const password = await Password.createFromPlainText(plainPassword);

			const isMatch = await password.compare(plainPassword);

			expect(isMatch).toBe(true);
		});

		it("誤ったパスワードでfalseを返す", async () => {
			const password = await Password.createFromPlainText("password123");

			const isMatch = await password.compare("wrongpassword");

			expect(isMatch).toBe(false);
		});

		it("空文字列でfalseを返す", async () => {
			const password = await Password.createFromPlainText("password123");

			const isMatch = await password.compare("");

			expect(isMatch).toBe(false);
		});
	});

	describe("getValue", () => {
		it("ハッシュ化されたパスワードを取得できる", async () => {
			const password = await Password.createFromPlainText("password123");
			const hash = password.getValue();

			expect(hash).toBeTruthy();
			expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/); // bcryptハッシュの形式
		});
	});
});

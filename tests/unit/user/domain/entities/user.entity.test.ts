import { describe, it, expect } from "vitest";
import { User } from "~/modules/user/domain/entities/user.entity";

describe("User Entity", () => {
	describe("create", () => {
		it("有効なプロパティでユーザーを作成できる", () => {
			const user = User.create({
				id: "user_123",
				userId: "test_user",
				name: "Test User",
				email: "test@example.com",
				passwordHash: "$2a$10$test.hash",
				role: "player",
			});

			expect(user).toBeInstanceOf(User);
			expect(user.id).toBe("user_123");
			expect(user.userId).toBe("test_user");
			expect(user.name).toBe("Test User");
			expect(user.email).toBe("test@example.com");
			expect(user.passwordHash).toBe("$2a$10$test.hash");
			expect(user.role).toBe("player");
		});

		it("メールアドレスなしでユーザーを作成できる", () => {
			const user = User.create({
				id: "user_123",
				userId: "test_user",
				name: "Test User",
				passwordHash: "$2a$10$test.hash",
				role: "player",
			});

			expect(user.email).toBeNull();
		});
	});

	describe("isAdmin", () => {
		it("adminロールでtrueを返す", () => {
			const user = User.create({
				id: "user_123",
				userId: "admin_user",
				name: "Admin User",
				passwordHash: "$2a$10$test.hash",
				role: "admin",
			});

			expect(user.isAdmin()).toBe(true);
		});

		it("admin以外のロールでfalseを返す", () => {
			const roles: Array<"player" | "coach" | "operator"> = [
				"player",
				"coach",
				"operator",
			];

			for (const role of roles) {
				const user = User.create({
					id: "user_123",
					userId: "test_user",
					name: "Test User",
					passwordHash: "$2a$10$test.hash",
					role,
				});

				expect(user.isAdmin()).toBe(false);
			}
		});
	});

	describe("isOperator", () => {
		it("operatorロールでtrueを返す", () => {
			const user = User.create({
				id: "user_123",
				userId: "operator_user",
				name: "Operator User",
				passwordHash: "$2a$10$test.hash",
				role: "operator",
			});

			expect(user.isOperator()).toBe(true);
		});

		it("operator以外のロールでfalseを返す", () => {
			const roles: Array<"player" | "coach" | "admin"> = [
				"player",
				"coach",
				"admin",
			];

			for (const role of roles) {
				const user = User.create({
					id: "user_123",
					userId: "test_user",
					name: "Test User",
					passwordHash: "$2a$10$test.hash",
					role,
				});

				expect(user.isOperator()).toBe(false);
			}
		});
	});

	describe("canManageUsers", () => {
		it("adminロールでtrueを返す", () => {
			const user = User.create({
				id: "user_123",
				userId: "admin_user",
				name: "Admin User",
				passwordHash: "$2a$10$test.hash",
				role: "admin",
			});

			expect(user.canManageUsers()).toBe(true);
		});

		it("operatorロールでtrueを返す", () => {
			const user = User.create({
				id: "user_123",
				userId: "operator_user",
				name: "Operator User",
				passwordHash: "$2a$10$test.hash",
				role: "operator",
			});

			expect(user.canManageUsers()).toBe(true);
		});

		it("playerとcoachロールでfalseを返す", () => {
			const roles: Array<"player" | "coach"> = ["player", "coach"];

			for (const role of roles) {
				const user = User.create({
					id: "user_123",
					userId: "test_user",
					name: "Test User",
					passwordHash: "$2a$10$test.hash",
					role,
				});

				expect(user.canManageUsers()).toBe(false);
			}
		});
	});

	describe("toPublicData", () => {
		it("パスワードハッシュを含まない公開データを返す", () => {
			const user = User.create({
				id: "user_123",
				userId: "test_user",
				name: "Test User",
				email: "test@example.com",
				passwordHash: "$2a$10$test.hash",
				role: "player",
			});

			const publicData = user.toPublicData();

			expect(publicData).toEqual({
				id: "user_123",
				userId: "test_user",
				name: "Test User",
				email: "test@example.com",
				role: "player",
			});
			expect(publicData).not.toHaveProperty("passwordHash");
		});
	});
});

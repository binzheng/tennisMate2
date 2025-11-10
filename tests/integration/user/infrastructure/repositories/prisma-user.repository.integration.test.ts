import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PrismaUserRepository } from "~/modules/user/infrastructure/repositories/prisma-user.repository";
import { User } from "~/modules/user/domain/entities/user.entity";
import { Password } from "~/modules/user/domain/value-objects/password.vo";
import {
	getTestDb,
	cleanupDatabase,
	disconnectDb,
} from "../../../../helpers/db-helper";

describe("PrismaUserRepository Integration Test", () => {
	let repository: PrismaUserRepository;
	const db = getTestDb();

	beforeEach(async () => {
		await cleanupDatabase();
		repository = new PrismaUserRepository(db);
	});

	afterAll(async () => {
		await cleanupDatabase();
		await disconnectDb();
	});

	describe("create", () => {
		it("新しいユーザーをデータベースに作成できる", async () => {
			const password = await Password.createFromPlainText("password123");
			const user = User.create({
				id: "test_user_1",
				userId: "testuser1",
				name: "Test User 1",
				email: "test1@example.com",
				passwordHash: password.getValue(),
				role: "player",
			});

			const created = await repository.create(user);

			expect(created).toBeDefined();
			expect(created.id).toBe("test_user_1");
			expect(created.userId).toBe("testuser1");
			expect(created.name).toBe("Test User 1");
			expect(created.email).toBe("test1@example.com");
			expect(created.role).toBe("player");
		});
	});

	describe("findAll", () => {
		it("すべてのユーザーを取得できる", async () => {
			const password = await Password.createFromPlainText("password123");

			const user1 = User.create({
				id: "test_user_1",
				userId: "testuser1",
				name: "Test User 1",
				email: "test1@example.com",
				passwordHash: password.getValue(),
				role: "player",
			});

			const user2 = User.create({
				id: "test_user_2",
				userId: "testuser2",
				name: "Test User 2",
				email: "test2@example.com",
				passwordHash: password.getValue(),
				role: "admin",
			});

			await repository.create(user1);
			await repository.create(user2);

			const users = await repository.findAll();

			expect(users).toHaveLength(2);
			expect(users.some((u) => u.userId === "testuser1")).toBe(true);
			expect(users.some((u) => u.userId === "testuser2")).toBe(true);
		});

		it("ユーザーがいない場合、空の配列を返す", async () => {
			const users = await repository.findAll();

			expect(users).toEqual([]);
		});
	});

	describe("findById", () => {
		it("IDでユーザーを取得できる", async () => {
			const password = await Password.createFromPlainText("password123");
			const user = User.create({
				id: "test_user_1",
				userId: "testuser1",
				name: "Test User 1",
				email: "test1@example.com",
				passwordHash: password.getValue(),
				role: "player",
			});

			await repository.create(user);

			const found = await repository.findById("test_user_1");

			expect(found).toBeDefined();
			expect(found?.id).toBe("test_user_1");
		});

		it("存在しないIDでnullを返す", async () => {
			const found = await repository.findById("non_existent_id");

			expect(found).toBeNull();
		});
	});

	describe("findByUserId", () => {
		it("ユーザーIDでユーザーを取得できる", async () => {
			const password = await Password.createFromPlainText("password123");
			const user = User.create({
				id: "test_user_1",
				userId: "testuser1",
				name: "Test User 1",
				email: "test1@example.com",
				passwordHash: password.getValue(),
				role: "player",
			});

			await repository.create(user);

			const found = await repository.findByUserId("testuser1");

			expect(found).toBeDefined();
			expect(found?.userId).toBe("testuser1");
		});

		it("存在しないユーザーIDでnullを返す", async () => {
			const found = await repository.findByUserId("non_existent_user");

			expect(found).toBeNull();
		});
	});

	describe("findByEmail", () => {
		it("メールアドレスでユーザーを取得できる", async () => {
			const password = await Password.createFromPlainText("password123");
			const user = User.create({
				id: "test_user_1",
				userId: "testuser1",
				name: "Test User 1",
				email: "test1@example.com",
				passwordHash: password.getValue(),
				role: "player",
			});

			await repository.create(user);

			const found = await repository.findByEmail("test1@example.com");

			expect(found).toBeDefined();
			expect(found?.email).toBe("test1@example.com");
		});

		it("存在しないメールアドレスでnullを返す", async () => {
			const found = await repository.findByEmail("nonexistent@example.com");

			expect(found).toBeNull();
		});
	});

	describe("update", () => {
		it("ユーザー情報を更新できる", async () => {
			const password = await Password.createFromPlainText("password123");
			const user = User.create({
				id: "test_user_1",
				userId: "testuser1",
				name: "Test User 1",
				email: "test1@example.com",
				passwordHash: password.getValue(),
				role: "player",
			});

			await repository.create(user);

			const updated = await repository.update("test_user_1", {
				name: "Updated User",
				role: "admin",
			});

			expect(updated.name).toBe("Updated User");
			expect(updated.role).toBe("admin");
		});
	});

	describe("delete", () => {
		it("ユーザーを削除できる", async () => {
			const password = await Password.createFromPlainText("password123");
			const user = User.create({
				id: "test_user_1",
				userId: "testuser1",
				name: "Test User 1",
				email: "test1@example.com",
				passwordHash: password.getValue(),
				role: "player",
			});

			await repository.create(user);
			await repository.delete("test_user_1");

			const found = await repository.findById("test_user_1");

			expect(found).toBeNull();
		});
	});
});

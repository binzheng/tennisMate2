import { describe, it, expect, beforeEach } from "vitest";
import { CreateUserUseCase } from "~/modules/user/application/use-cases/create-user.use-case";
import { MockUserRepository } from "../../../../helpers/mock-helper";
import { TestFactory } from "../../../../helpers/test-factory";

describe("CreateUserUseCase", () => {
	let useCase: CreateUserUseCase;
	let mockRepository: MockUserRepository;

	beforeEach(() => {
		mockRepository = new MockUserRepository();
		useCase = new CreateUserUseCase(mockRepository);
	});

	it("有効なデータで新しいユーザーを作成できる", async () => {
		const dto = {
			userId: "new_user",
			name: "New User",
			email: "newuser@example.com",
			password: "password123",
			role: "player" as const,
		};

		const result = await useCase.execute(dto);

		expect(result).toBeDefined();
		expect(result.userId).toBe("new_user");
		expect(result.name).toBe("New User");
		expect(result.email).toBe("newuser@example.com");
		expect(result.role).toBe("player");
		expect(result).not.toHaveProperty("passwordHash");
	});

	it("パスワードがハッシュ化されて保存される", async () => {
		const dto = {
			userId: "new_user",
			name: "New User",
			email: "newuser@example.com",
			password: "password123",
			role: "player" as const,
		};

		await useCase.execute(dto);

		const users = await mockRepository.findAll();
		const createdUser = users[0];

		expect(createdUser?.passwordHash).toBeTruthy();
		expect(createdUser?.passwordHash).not.toBe("password123");
	});

	it("重複したユーザーIDでエラーをスローする", async () => {
		const existingUser = TestFactory.createUser({ userId: "existing_user" });
		mockRepository.setUsers([existingUser]);

		const dto = {
			userId: "existing_user",
			name: "New User",
			email: "newuser@example.com",
			password: "password123",
			role: "player" as const,
		};

		await expect(useCase.execute(dto)).rejects.toThrow(
			"このユーザーIDは既に使用されています",
		);
	});

	it("重複したメールアドレスでエラーをスローする", async () => {
		const existingUser = TestFactory.createUser({
			email: "existing@example.com",
		});
		mockRepository.setUsers([existingUser]);

		const dto = {
			userId: "new_user",
			name: "New User",
			email: "existing@example.com",
			password: "password123",
			role: "player" as const,
		};

		await expect(useCase.execute(dto)).rejects.toThrow(
			"このメールアドレスは既に使用されています",
		);
	});

	it("8文字未満のパスワードでエラーをスローする", async () => {
		const dto = {
			userId: "new_user",
			name: "New User",
			email: "newuser@example.com",
			password: "pass", // 8文字未満
			role: "player" as const,
		};

		await expect(useCase.execute(dto)).rejects.toThrow(
			"パスワードは8文字以上必要です",
		);
	});

	it("メールアドレスなしでユーザーを作成できる", async () => {
		const dto = {
			userId: "new_user",
			name: "New User",
			password: "password123",
			role: "player" as const,
		};

		const result = await useCase.execute(dto);

		expect(result).toBeDefined();
		expect(result.userId).toBe("new_user");
		expect(result.email).toBeNull();
	});

	it("異なるロールでユーザーを作成できる", async () => {
		const roles: Array<"player" | "coach" | "operator" | "admin"> = [
			"player",
			"coach",
			"operator",
			"admin",
		];

		for (const role of roles) {
			mockRepository.clear();

			const dto = {
				userId: `${role}_user`,
				name: `${role} User`,
				email: `${role}@example.com`,
				password: "password123",
				role,
			};

			const result = await useCase.execute(dto);

			expect(result.role).toBe(role);
		}
	});
});

import {
	User,
	type UserRole,
} from "~/modules/user/domain/entities/user.entity";

export class TestFactory {
	static createUser(overrides?: Partial<User>): User {
		const defaultUser = {
			id: `test_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			userId: `test${Math.random().toString(36).substr(2, 9)}`,
			name: "Test User",
			email: `test${Math.random().toString(36).substr(2, 9)}@example.com`,
			passwordHash: "$2a$10$test.hash.value.for.testing.purposes.only",
			role: "player" as UserRole,
			emailVerified: null,
			image: null,
		};

		return new User(
			overrides?.id || defaultUser.id,
			overrides?.userId !== undefined ? overrides.userId : defaultUser.userId,
			overrides?.name !== undefined ? overrides.name : defaultUser.name,
			overrides?.email !== undefined ? overrides.email : defaultUser.email,
			overrides?.passwordHash !== undefined
				? overrides.passwordHash
				: defaultUser.passwordHash,
			overrides?.role || defaultUser.role,
			overrides?.emailVerified !== undefined
				? overrides.emailVerified
				: defaultUser.emailVerified,
			overrides?.image !== undefined ? overrides.image : defaultUser.image,
		);
	}

	static createAdminUser(overrides?: Partial<User>): User {
		return this.createUser({ ...overrides, role: "admin" });
	}

	static createOperatorUser(overrides?: Partial<User>): User {
		return this.createUser({ ...overrides, role: "operator" });
	}

	static createCoachUser(overrides?: Partial<User>): User {
		return this.createUser({ ...overrides, role: "coach" });
	}

	static createPlayerUser(overrides?: Partial<User>): User {
		return this.createUser({ ...overrides, role: "player" });
	}
}

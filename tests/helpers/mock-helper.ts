import type { User } from "~/modules/user/domain/entities/user.entity";
import type { IUserRepository } from "~/modules/user/domain/repositories/user.repository.interface";

export class MockUserRepository implements IUserRepository {
	private users: User[] = [];

	async findAll(): Promise<User[]> {
		return this.users;
	}

	async findById(id: string): Promise<User | null> {
		return this.users.find((u) => u.id === id) || null;
	}

	async findByUserId(userId: string): Promise<User | null> {
		return this.users.find((u) => u.userId === userId) || null;
	}

	async findByEmail(email: string): Promise<User | null> {
		return this.users.find((u) => u.email === email) || null;
	}

	async create(user: User): Promise<User> {
		this.users.push(user);
		return user;
	}

	async update(id: string, userData: Partial<User>): Promise<User> {
		const index = this.users.findIndex((u) => u.id === id);
		if (index === -1) {
			throw new Error("User not found");
		}

		const user = this.users[index];
		if (!user) {
			throw new Error("User not found");
		}

		const updatedUser = Object.assign(user, userData);
		this.users[index] = updatedUser;
		return updatedUser;
	}

	async delete(id: string): Promise<void> {
		this.users = this.users.filter((u) => u.id !== id);
	}

	// テスト用のヘルパーメソッド
	setUsers(users: User[]) {
		this.users = users;
	}

	clear() {
		this.users = [];
	}
}

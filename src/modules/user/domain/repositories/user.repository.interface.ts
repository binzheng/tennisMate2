import type { User } from "../entities/user.entity";

export interface IUserRepository {
	findAll(): Promise<User[]>;
	findById(id: string): Promise<User | null>;
	findByUserId(userId: string): Promise<User | null>;
	findByEmail(email: string): Promise<User | null>;
	create(user: User): Promise<User>;
	update(id: string, user: Partial<User>): Promise<User>;
	delete(id: string): Promise<void>;
}

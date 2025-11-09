import type { db } from "~/server/db";
import { User, type UserRole } from "../../domain/entities/user.entity";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";

type PrismaClient = typeof db;

export class PrismaUserRepository implements IUserRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findAll(): Promise<User[]> {
		const users = await this.prisma.user.findMany({
			orderBy: { id: "desc" },
		});
		return users.map(this.toDomain);
	}

	async findById(id: string): Promise<User | null> {
		const user = await this.prisma.user.findUnique({
			where: { id },
		});
		return user ? this.toDomain(user) : null;
	}

	async findByUserId(userId: string): Promise<User | null> {
		const user = await this.prisma.user.findUnique({
			where: { userId },
		});
		return user ? this.toDomain(user) : null;
	}

	async findByEmail(email: string): Promise<User | null> {
		const user = await this.prisma.user.findUnique({
			where: { email },
		});
		return user ? this.toDomain(user) : null;
	}

	async create(user: User): Promise<User> {
		const created = await this.prisma.user.create({
			data: {
				id: user.id,
				userId: user.userId,
				name: user.name,
				email: user.email,
				passwordHash: user.passwordHash,
				role: user.role,
			},
		});
		return this.toDomain(created);
	}

	async update(id: string, user: Partial<User>): Promise<User> {
		const updated = await this.prisma.user.update({
			where: { id },
			data: {
				...(user.userId !== undefined && { userId: user.userId }),
				...(user.name !== undefined && { name: user.name }),
				...(user.email !== undefined && { email: user.email }),
				...(user.passwordHash !== undefined && {
					passwordHash: user.passwordHash,
				}),
				...(user.role !== undefined && { role: user.role }),
			},
		});
		return this.toDomain(updated);
	}

	async delete(id: string): Promise<void> {
		await this.prisma.user.delete({
			where: { id },
		});
	}

	private toDomain(prismaUser: {
		id: string;
		userId: string | null;
		name: string | null;
		email: string | null;
		emailVerified: Date | null;
		image: string | null;
		role: string;
		passwordHash: string | null;
	}): User {
		return new User(
			prismaUser.id,
			prismaUser.userId,
			prismaUser.name,
			prismaUser.email,
			prismaUser.passwordHash,
			prismaUser.role as UserRole,
			prismaUser.emailVerified,
			prismaUser.image,
		);
	}
}

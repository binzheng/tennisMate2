import type { UserRole } from "../../domain/entities/user.entity";

export interface CreateUserDto {
	userId: string;
	name: string;
	email?: string;
	password: string;
	role: UserRole;
}

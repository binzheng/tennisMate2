import type { UserRole } from "../../domain/entities/user.entity";

export interface UpdateUserDto {
	userId?: string;
	name?: string;
	email?: string;
	password?: string;
	role?: UserRole;
}

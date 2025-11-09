import type { UserRole } from "../../domain/entities/user.entity";

export interface UserResponseDto {
	id: string;
	userId: string | null;
	name: string | null;
	email: string | null;
	role: UserRole;
}

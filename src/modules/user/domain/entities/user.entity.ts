export type UserRole = "player" | "coach" | "operator" | "admin";

export interface UserEntity {
	id: string;
	userId: string | null;
	name: string | null;
	email: string | null;
	passwordHash: string | null;
	role: UserRole;
	emailVerified: Date | null;
	image: string | null;
}

export class User implements UserEntity {
	constructor(
		public id: string,
		public userId: string | null,
		public name: string | null,
		public email: string | null,
		public passwordHash: string | null,
		public role: UserRole,
		public emailVerified: Date | null = null,
		public image: string | null = null,
	) {}

	static create(props: {
		id: string;
		userId: string;
		name: string;
		email?: string;
		passwordHash: string;
		role: UserRole;
	}): User {
		return new User(
			props.id,
			props.userId,
			props.name,
			props.email ?? null,
			props.passwordHash,
			props.role,
			null,
			null,
		);
	}

	isAdmin(): boolean {
		return this.role === "admin";
	}

	isOperator(): boolean {
		return this.role === "operator";
	}

	canManageUsers(): boolean {
		return this.isAdmin() || this.isOperator();
	}

	toPublicData() {
		return {
			id: this.id,
			userId: this.userId,
			name: this.name,
			email: this.email,
			role: this.role,
		};
	}
}

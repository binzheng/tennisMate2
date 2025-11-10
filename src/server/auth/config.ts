import { PrismaAdapter } from "@auth/prisma-adapter";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import { Password } from "~/modules/user/domain/value-objects/password.vo";
import { PrismaUserRepository } from "~/modules/user/infrastructure/repositories/prisma-user.repository";
import { db } from "~/server/db";

type Role = "player" | "coach" | "operator" | "admin";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			role: Role;
		} & DefaultSession["user"];
	}

	interface User {
		role: Role;
	}
}

declare module "@auth/core/adapters" {
	interface AdapterUser {
		role: Role;
	}
}

declare module "@auth/core/jwt" {
	interface JWT {
		id: string;
		role: Role;
	}
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				const userRepository = new PrismaUserRepository(db);
				const user = await userRepository.findByEmail(
					credentials.email as string,
				);

				if (!user || !user.passwordHash) {
					return null;
				}

				const password = Password.fromHash(user.passwordHash);
				const isValid = await password.compare(credentials.password as string);

				if (!isValid) {
					return null;
				}

				return {
					id: user.id,
					email: user.email,
					name: user.name,
					role: user.role,
				};
			},
		}),
		DiscordProvider,
	],
	adapter: PrismaAdapter(db),
	session: {
		strategy: "jwt",
	},
	pages: {
		signIn: "/login",
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.role = user.role;
			}
			return token;
		},
		async session({ session, token }) {
			return {
				...session,
				user: {
					...session.user,
					id: token.id as string,
					role: token.role as Role,
				},
			};
		},
	},
} satisfies NextAuthConfig;

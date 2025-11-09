import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { CreateUserUseCase } from "~/modules/user/application/use-cases/create-user.use-case";
import { DeleteUserUseCase } from "~/modules/user/application/use-cases/delete-user.use-case";
import { GetUserByIdUseCase } from "~/modules/user/application/use-cases/get-user-by-id.use-case";
import { GetUsersUseCase } from "~/modules/user/application/use-cases/get-users.use-case";
import { UpdateUserUseCase } from "~/modules/user/application/use-cases/update-user.use-case";
import { PrismaUserRepository } from "~/modules/user/infrastructure/repositories/prisma-user.repository";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Admin権限チェックのミドルウェア
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
	if (
		ctx.session.user.role !== "admin" &&
		ctx.session.user.role !== "operator"
	) {
		throw new TRPCError({ code: "FORBIDDEN", message: "管理者権限が必要です" });
	}
	return next();
});

export const userRouter = createTRPCRouter({
	// 全ユーザー取得
	getAll: adminProcedure.query(async ({ ctx }) => {
		const repository = new PrismaUserRepository(ctx.db);
		const useCase = new GetUsersUseCase(repository);
		return await useCase.execute();
	}),

	// ユーザーID検索
	getById: adminProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const repository = new PrismaUserRepository(ctx.db);
			const useCase = new GetUserByIdUseCase(repository);
			try {
				return await useCase.execute(input.id);
			} catch (error) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message:
						error instanceof Error ? error.message : "エラーが発生しました",
				});
			}
		}),

	// ユーザー作成
	create: adminProcedure
		.input(
			z.object({
				userId: z.string().min(3, "ユーザーIDは3文字以上必要です"),
				name: z.string().min(1, "名前は必須です"),
				email: z
					.string()
					.email("有効なメールアドレスを入力してください")
					.optional(),
				password: z.string().min(8, "パスワードは8文字以上必要です"),
				role: z.enum(["player", "coach", "operator", "admin"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const repository = new PrismaUserRepository(ctx.db);
			const useCase = new CreateUserUseCase(repository);
			try {
				return await useCase.execute(input);
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error ? error.message : "エラーが発生しました",
				});
			}
		}),

	// ユーザー更新
	update: adminProcedure
		.input(
			z.object({
				id: z.string(),
				userId: z.string().min(3, "ユーザーIDは3文字以上必要です").optional(),
				name: z.string().min(1, "名前は必須です").optional(),
				email: z
					.string()
					.email("有効なメールアドレスを入力してください")
					.optional(),
				password: z.string().min(8, "パスワードは8文字以上必要です").optional(),
				role: z.enum(["player", "coach", "operator", "admin"]).optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...updateData } = input;
			const repository = new PrismaUserRepository(ctx.db);
			const useCase = new UpdateUserUseCase(repository);
			try {
				return await useCase.execute(id, updateData);
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error ? error.message : "エラーが発生しました",
				});
			}
		}),

	// ユーザー削除
	delete: adminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const repository = new PrismaUserRepository(ctx.db);
			const useCase = new DeleteUserUseCase(repository);
			try {
				await useCase.execute(input.id, ctx.session.user.id);
				return { success: true };
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error ? error.message : "エラーが発生しました",
				});
			}
		}),
});

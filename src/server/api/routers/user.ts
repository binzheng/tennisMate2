import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
	createUserSchema,
	updateUserSchema,
} from "~/lib/validations/user.schema";
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

	// コーチ一覧取得
	getCoaches: adminProcedure.query(async ({ ctx }) => {
		const coaches = await ctx.db.user.findMany({
			where: { role: "coach" },
			select: {
				id: true,
				userId: true,
				name: true,
			},
			orderBy: { name: "asc" },
		});
		return coaches;
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
		.input(createUserSchema)
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
		.input(updateUserSchema)
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

import { TRPCError } from "@trpc/server";

import {
	createLessonSchema,
	deleteLessonSchema,
	updateLessonSchema,
} from "~/lib/validations/lesson.schema";
import { CreateLessonUseCase } from "~/modules/lesson/application/use-cases/create-lesson.use-case";
import { DeleteLessonUseCase } from "~/modules/lesson/application/use-cases/delete-lesson.use-case";
import { GetAllLessonsUseCase } from "~/modules/lesson/application/use-cases/get-all-lessons.use-case";
import { UpdateLessonUseCase } from "~/modules/lesson/application/use-cases/update-lesson.use-case";
import { PrismaLessonRepository } from "~/modules/lesson/infrastructure/repositories/prisma-lesson.repository";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Admin or Operator権限チェックのミドルウェア
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
	if (
		ctx.session.user.role !== "admin" &&
		ctx.session.user.role !== "operator"
	) {
		throw new TRPCError({ code: "FORBIDDEN", message: "管理者権限が必要です" });
	}
	return next();
});

export const lessonRouter = createTRPCRouter({
	// 全レッスン取得
	getAll: adminProcedure.query(async ({ ctx }) => {
		const repository = new PrismaLessonRepository(ctx.db);
		const useCase = new GetAllLessonsUseCase(repository);
		const lessons = await useCase.execute();

		// コート名を追加
		const lessonSlots = await ctx.db.lessonSlot.findMany({
			include: {
				Court: {
					select: {
						name: true,
					},
				},
			},
		});

		return lessons.map((lesson) => {
			const slot = lessonSlots.find((s) => s.id === lesson.id);
			return {
				...lesson,
				courtName: slot?.Court?.name,
			};
		});
	}),

	// コート一覧取得
	getCourts: adminProcedure.query(async ({ ctx }) => {
		const courts = await ctx.db.court.findMany({
			select: {
				id: true,
				name: true,
			},
			orderBy: { name: "asc" },
		});
		return courts;
	}),

	// レッスン作成
	create: adminProcedure
		.input(createLessonSchema)
		.mutation(async ({ ctx, input }) => {
			const repository = new PrismaLessonRepository(ctx.db);
			const useCase = new CreateLessonUseCase(repository);
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

	// レッスン更新
	update: adminProcedure
		.input(updateLessonSchema)
		.mutation(async ({ ctx, input }) => {
			const repository = new PrismaLessonRepository(ctx.db);
			const useCase = new UpdateLessonUseCase(repository);
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

	// レッスン削除
	delete: adminProcedure
		.input(deleteLessonSchema)
		.mutation(async ({ ctx, input }) => {
			const repository = new PrismaLessonRepository(ctx.db);
			const useCase = new DeleteLessonUseCase(repository);
			try {
				await useCase.execute(input.id);
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

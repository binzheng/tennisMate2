import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { generateMatchSessionsPDF } from "~/lib/pdf/generate-match-sessions-pdf";
import { generateSessionDetailPDF } from "~/lib/pdf/generate-session-detail-pdf";
import {
	createSessionSchema,
	updateGameResultSchema,
} from "~/lib/validations/match.schema";
import { CreateMatchSessionUseCase } from "~/modules/match/application/use-cases/create-match-session.use-case";
import { DeleteMatchSessionUseCase } from "~/modules/match/application/use-cases/delete-match-session.use-case";
import { GetAllSessionsUseCase } from "~/modules/match/application/use-cases/get-all-sessions.use-case";
import { GetMatchSessionUseCase } from "~/modules/match/application/use-cases/get-match-session.use-case";
import { UpdateGameResultUseCase } from "~/modules/match/application/use-cases/update-game-result.use-case";
import { PrismaMatchSessionRepository } from "~/modules/match/infrastructure/repositories/prisma-match-session.repository";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const matchRouter = createTRPCRouter({
	// セッション作成
	create: protectedProcedure
		.input(createSessionSchema)
		.mutation(async ({ ctx, input }) => {
			const repository = new PrismaMatchSessionRepository(ctx.db);
			const useCase = new CreateMatchSessionUseCase(repository);

			try {
				return await useCase.execute({
					name: input.name,
					date: input.date,
					players: input.players,
					createdBy: ctx.session.user.id,
				});
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error
							? error.message
							: "セッションの作成に失敗しました",
				});
			}
		}),

	// 全セッション取得
	getAll: protectedProcedure.query(async ({ ctx }) => {
		const repository = new PrismaMatchSessionRepository(ctx.db);
		const useCase = new GetAllSessionsUseCase(repository);

		try {
			return await useCase.execute();
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message:
					error instanceof Error
						? error.message
						: "セッションの取得に失敗しました",
			});
		}
	}),

	// 既存ユーザーのプレイヤー候補（認証ユーザーなら誰でも取得可）
	getSelectablePlayers: protectedProcedure.query(async ({ ctx }) => {
		const users = await ctx.db.user.findMany({
			where: { role: "player" },
			select: { id: true, name: true, userId: true },
			orderBy: { name: "asc" },
		});
		return users
			.filter((u) => (u.name ?? "").trim() !== "")
			.map((u) => ({ id: u.id, name: u.name as string, userId: u.userId }));
	}),

	// セッション詳細取得（ゲーム含む）
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const repository = new PrismaMatchSessionRepository(ctx.db);
			const useCase = new GetMatchSessionUseCase(repository);

			try {
				const session = await useCase.execute(input.id);
				if (!session) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "セッションが見つかりません",
					});
				}
				return session;
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error
							? error.message
							: "セッションの取得に失敗しました",
				});
			}
		}),

	// ゲーム結果更新
	updateGameResult: protectedProcedure
		.input(updateGameResultSchema)
		.mutation(async ({ ctx, input }) => {
			const repository = new PrismaMatchSessionRepository(ctx.db);
			const useCase = new UpdateGameResultUseCase(repository);

			try {
				await useCase.execute(input);
				return { success: true };
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error
							? error.message
							: "ゲーム結果の更新に失敗しました",
				});
			}
		}),

	// セッション削除
	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const repository = new PrismaMatchSessionRepository(ctx.db);
			const useCase = new DeleteMatchSessionUseCase(repository);

			try {
				await useCase.execute({ id: input.id });
				return { success: true };
			} catch (error) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						error instanceof Error
							? error.message
							: "セッションの削除に失敗しました",
				});
			}
		}),

	// 全セッション一覧PDF生成
	generatePDF: protectedProcedure.query(async ({ ctx }) => {
		const repository = new PrismaMatchSessionRepository(ctx.db);
		const useCase = new GetAllSessionsUseCase(repository);

		try {
			const sessions = await useCase.execute();
			const pdfBytes = await generateMatchSessionsPDF(sessions);

			// Convert Uint8Array to base64 string for transmission
			const base64 = Buffer.from(pdfBytes).toString("base64");

			return {
				pdf: base64,
				filename: `match-sessions-${new Date().toISOString().split("T")[0]}.pdf`,
			};
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message:
					error instanceof Error ? error.message : "PDFの生成に失敗しました",
			});
		}
	}),

	// 個別セッション詳細PDF生成
	generateSessionPDF: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const repository = new PrismaMatchSessionRepository(ctx.db);
			const useCase = new GetMatchSessionUseCase(repository);

			try {
				const session = await useCase.execute(input.id);
				if (!session) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "セッションが見つかりません",
					});
				}

				const pdfBytes = await generateSessionDetailPDF(session);

				// Convert Uint8Array to base64 string for transmission
				const base64 = Buffer.from(pdfBytes).toString("base64");

				return {
					pdf: base64,
					filename: `match-${session.name.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g, "_")}-${new Date().toISOString().split("T")[0]}.pdf`,
				};
			} catch (error) {
				if (error instanceof TRPCError) {
					throw error;
				}
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error ? error.message : "PDFの生成に失敗しました",
				});
			}
		}),
});

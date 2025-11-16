import { z } from "zod";

// プレイヤー情報スキーマ
export const playerInfoSchema = z.object({
	id: z.string(),
	name: z.string().min(1, "プレイヤー名は必須です"),
	userId: z.string().nullable(),
});

// セッション作成スキーマ（サーバー側）
export const createSessionSchema = z.object({
	name: z.string().min(1, "セッション名は必須です"),
	date: z.date(),
	players: z.array(playerInfoSchema).min(4, "最低4人のプレイヤーが必要です"),
});

// ゲーム結果更新スキーマ
export const updateGameResultSchema = z.object({
	gameId: z.string(),
	playerScores: z.array(
		z.object({
			playerId: z.string(),
			score: z.number().int().min(0, "スコアは0以上である必要があります"),
		}),
	),
	winner: z
		.number()
		.int()
		.min(1)
		.max(2, "勝者はチーム1または2である必要があります"),
});

// クライアント側フォーム用スキーマ
export const sessionFormSchema = z.object({
	name: z.string().min(1, "セッション名は必須です"),
	date: z.string().min(1, "日付は必須です"),
	playerCount: z
		.number()
		.int()
		.min(4, "最低4人必要です")
		.max(20, "最大20人まで"),
});

// 型エクスポート
export type PlayerInfo = z.infer<typeof playerInfoSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateGameResultInput = z.infer<typeof updateGameResultSchema>;
export type SessionFormInput = z.infer<typeof sessionFormSchema>;

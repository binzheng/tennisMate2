import { nanoid } from "nanoid";
import { MatchGame } from "../../domain/entities/match-game.entity";
import { MatchSession } from "../../domain/entities/match-session.entity";
import type { MatchSessionRepository } from "../../domain/repositories/match-session.repository.interface";
import { generateMatches, type PlayerInfo } from "../utils/match-generator";

export interface CreateMatchSessionInput {
	name: string;
	date: Date;
	players: PlayerInfo[];
	createdBy: string;
}

export interface CreateMatchSessionOutput {
	id: string;
	name: string;
	date: Date;
	playerCount: number;
	gameCount: number;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
}

export class CreateMatchSessionUseCase {
	constructor(private readonly repository: MatchSessionRepository) {}

	async execute(
		input: CreateMatchSessionInput,
	): Promise<CreateMatchSessionOutput> {
		// バリデーション
		if (!input.name || input.name.trim() === "") {
			throw new Error("セッション名は必須です");
		}

		if (input.players.length < 4) {
			throw new Error("最低4人のプレイヤーが必要です");
		}

		// 組み合わせを生成
		const matches = generateMatches(input.players);

		// セッションを作成
		const sessionId = nanoid();
		const session = MatchSession.create({
			id: sessionId,
			name: input.name,
			date: input.date,
			playerCount: input.players.length,
			createdBy: input.createdBy,
		});

		const createdSession = await this.repository.create(session);

		// 各ゲームを作成
		for (const match of matches) {
			// チーム1、チーム2のプレイヤー
			const gamePlayers = [
				{
					id: nanoid(),
					userId: match.team1[0].userId,
					playerName: match.team1[0].name,
					team: 1,
					position: 0,
					score: null,
				},
				{
					id: nanoid(),
					userId: match.team1[1].userId,
					playerName: match.team1[1].name,
					team: 1,
					position: 1,
					score: null,
				},
				{
					id: nanoid(),
					userId: match.team2[0].userId,
					playerName: match.team2[0].name,
					team: 2,
					position: 2,
					score: null,
				},
				{
					id: nanoid(),
					userId: match.team2[1].userId,
					playerName: match.team2[1].name,
					team: 2,
					position: 3,
					score: null,
				},
			];

			// 休んでいるプレイヤー（team=0として記録）
			const restingPlayers = match.restingPlayers.map((player, index) => ({
				id: nanoid(),
				userId: player.userId,
				playerName: player.name,
				team: 0, // 0 = 休み
				position: 4 + index, // プレイヤーの後のポジション
				score: null,
			}));

			const game = MatchGame.create({
				id: nanoid(),
				sessionId: createdSession.id,
				gameNumber: match.gameNumber,
				status: "scheduled",
				winner: null,
				players: [...gamePlayers, ...restingPlayers],
			});

			await this.repository.createGame(game);
		}

		return {
			id: createdSession.id,
			name: createdSession.name,
			date: createdSession.date,
			playerCount: createdSession.playerCount,
			gameCount: matches.length,
			createdBy: createdSession.createdBy,
			createdAt: createdSession.createdAt,
			updatedAt: createdSession.updatedAt,
		};
	}
}

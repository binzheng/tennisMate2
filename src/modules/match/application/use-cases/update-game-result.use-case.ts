import { MatchGame } from "../../domain/entities/match-game.entity";
import type { MatchSessionRepository } from "../../domain/repositories/match-session.repository.interface";

export interface UpdateGameResultInput {
	gameId: string;
	playerScores: {
		playerId: string;
		score: number;
	}[];
	winner: number;
}

export class UpdateGameResultUseCase {
	constructor(private readonly repository: MatchSessionRepository) {}

	async execute(input: UpdateGameResultInput): Promise<void> {
		// ゲームの情報を取得
		const targetGame = await this.repository.findGameById(input.gameId);
		if (!targetGame) {
			throw new Error("ゲームが見つかりません");
		}

		// 既に結果が確定しているゲームは更新不可
		if (targetGame.status === "completed") {
			throw new Error("このゲームは既に結果が確定しています");
		}

		// プレイヤーのスコアを更新
		const updatedPlayers = targetGame.players.map((player) => {
			const scoreUpdate = input.playerScores.find(
				(s) => s.playerId === player.id,
			);
			return {
				...player,
				score: scoreUpdate ? scoreUpdate.score : player.score,
			};
		});

		// チームごとの合計スコアを計算
		const team1Score = updatedPlayers
			.filter((p) => p.team === 1)
			.reduce((sum, p) => sum + (p.score ?? 0), 0);
		const team2Score = updatedPlayers
			.filter((p) => p.team === 2)
			.reduce((sum, p) => sum + (p.score ?? 0), 0);

		// 勝者判定: 45点は特別扱いしない。スコアが大きい方が勝ち
		const winner: 1 | 2 = team1Score >= team2Score ? 1 : 2;

		// ステータス判定: 最大点が45以下なら進行中のまま、46以上が出ていれば確定
		const maxTeamScore = Math.max(team1Score, team2Score);
		const shouldComplete = maxTeamScore >= 45;

		const updatedGame = MatchGame.create({
			id: targetGame.id,
			sessionId: targetGame.sessionId,
			gameNumber: targetGame.gameNumber,
			status: shouldComplete ? "completed" : targetGame.status,
			winner: shouldComplete ? winner : null,
			players: updatedPlayers,
		});

		await this.repository.updateGame(updatedGame);
	}
}

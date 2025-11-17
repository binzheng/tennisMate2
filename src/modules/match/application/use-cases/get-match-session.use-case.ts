import type { MatchSessionRepository } from "../../domain/repositories/match-session.repository.interface";

export interface GetMatchSessionOutput {
	id: string;
	name: string;
	date: Date;
	playerCount: number;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	games: {
		id: string;
		gameNumber: number;
		status: "scheduled" | "in_progress" | "completed";
		winner: number | null;
		players: {
			id: string;
			userId: string | null;
			playerName: string;
			team: number;
			position: number;
			score: number | null;
		}[];
	}[];
}

export class GetMatchSessionUseCase {
	constructor(private readonly repository: MatchSessionRepository) {}

	async execute(sessionId: string): Promise<GetMatchSessionOutput | null> {
		const session = await this.repository.findById(sessionId);
		if (!session) {
			return null;
		}

		const games = await this.repository.findGamesBySessionId(sessionId);

		return {
			id: session.id,
			name: session.name,
			date: session.date,
			playerCount: session.playerCount,
			createdBy: session.createdBy,
			createdAt: session.createdAt,
			updatedAt: session.updatedAt,
			games: games.map((game) => ({
				id: game.id,
				gameNumber: game.gameNumber,
				status: game.status,
				winner: game.winner,
				players: game.players,
			})),
		};
	}
}

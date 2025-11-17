import type { MatchSessionRepository } from "../../domain/repositories/match-session.repository.interface";

export interface SessionSummary {
	id: string;
	name: string;
	date: Date;
	playerCount: number;
	createdBy: string;
	createdAt: Date;
	games?: Array<{
		id: string;
		status: "pending" | "in_progress" | "completed";
	}>;
}

export class GetAllSessionsUseCase {
	constructor(private readonly repository: MatchSessionRepository) {}

	async execute(): Promise<SessionSummary[]> {
		const sessions = (await this.repository.findAll()) as SessionSummary[];

		return sessions.map((session) => ({
			id: session.id,
			name: session.name,
			date: session.date,
			playerCount: session.playerCount,
			createdBy: session.createdBy,
			createdAt: session.createdAt,
			games: session.games,
		}));
	}
}

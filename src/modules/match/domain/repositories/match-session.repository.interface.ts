import type { MatchGame } from "../entities/match-game.entity";
import type { MatchSession } from "../entities/match-session.entity";

export interface MatchSessionRepository {
	create(session: MatchSession): Promise<MatchSession>;
	findById(id: string): Promise<MatchSession | null>;
	findAll(): Promise<MatchSession[]>;
	findByCreatedBy(createdBy: string): Promise<MatchSession[]>;
	update(session: MatchSession): Promise<MatchSession>;
	delete(id: string): Promise<void>;

	// Game operations
	createGame(game: MatchGame): Promise<MatchGame>;
	findGameById(gameId: string): Promise<MatchGame | null>;
	findGamesBySessionId(sessionId: string): Promise<MatchGame[]>;
	updateGame(game: MatchGame): Promise<MatchGame>;
}

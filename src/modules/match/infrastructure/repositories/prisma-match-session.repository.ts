import type { db } from "~/server/db";
import { MatchGame } from "../../domain/entities/match-game.entity";
import { MatchSession } from "../../domain/entities/match-session.entity";
import type { MatchSessionRepository } from "../../domain/repositories/match-session.repository.interface";

type PrismaClient = typeof db;

export class PrismaMatchSessionRepository implements MatchSessionRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async create(session: MatchSession): Promise<MatchSession> {
		const created = await this.prisma.matchSession.create({
			data: {
				id: session.id,
				name: session.name,
				date: session.date,
				playerCount: session.playerCount,
				createdBy: session.createdBy,
			},
		});

		return MatchSession.create({
			id: created.id,
			name: created.name,
			date: created.date,
			playerCount: created.playerCount,
			createdBy: created.createdBy,
			createdAt: created.createdAt,
			updatedAt: created.updatedAt,
		});
	}

	async findById(id: string): Promise<MatchSession | null> {
		const session = await this.prisma.matchSession.findUnique({
			where: { id },
		});

		if (!session) {
			return null;
		}

		return MatchSession.create({
			id: session.id,
			name: session.name,
			date: session.date,
			playerCount: session.playerCount,
			createdBy: session.createdBy,
			createdAt: session.createdAt,
			updatedAt: session.updatedAt,
		});
	}

	async findAll(): Promise<MatchSession[]> {
		const sessions = await this.prisma.matchSession.findMany({
			include: {
				MatchGame: {
					select: {
						id: true,
						status: true,
					},
				},
			},
			orderBy: { date: "desc" },
		});

		return sessions.map((session) =>
			MatchSession.create({
				id: session.id,
				name: session.name,
				date: session.date,
				playerCount: session.playerCount,
				createdBy: session.createdBy,
				createdAt: session.createdAt,
				updatedAt: session.updatedAt,
			}),
		);
	}

	async findByCreatedBy(createdBy: string): Promise<MatchSession[]> {
		const sessions = await this.prisma.matchSession.findMany({
			where: { createdBy },
			orderBy: { date: "desc" },
		});

		return sessions.map((session) =>
			MatchSession.create({
				id: session.id,
				name: session.name,
				date: session.date,
				playerCount: session.playerCount,
				createdBy: session.createdBy,
				createdAt: session.createdAt,
				updatedAt: session.updatedAt,
			}),
		);
	}

	async update(session: MatchSession): Promise<MatchSession> {
		const updated = await this.prisma.matchSession.update({
			where: { id: session.id },
			data: {
				name: session.name,
				date: session.date,
				playerCount: session.playerCount,
			},
		});

		return MatchSession.create({
			id: updated.id,
			name: updated.name,
			date: updated.date,
			playerCount: updated.playerCount,
			createdBy: updated.createdBy,
			createdAt: updated.createdAt,
			updatedAt: updated.updatedAt,
		});
	}

	async delete(id: string): Promise<void> {
		await this.prisma.matchSession.delete({
			where: { id },
		});
	}

	async createGame(game: MatchGame): Promise<MatchGame> {
		const created = await this.prisma.matchGame.create({
			data: {
				id: game.id,
				sessionId: game.sessionId,
				gameNumber: game.gameNumber,
				status: game.status,
				winner: game.winner,
				MatchGamePlayer: {
					create: game.players.map((player) => ({
						id: player.id,
						userId: player.userId,
						playerName: player.playerName,
						team: player.team,
						position: player.position,
						score: player.score,
					})),
				},
			},
			include: {
				MatchGamePlayer: true,
			},
		});

		return MatchGame.create({
			id: created.id,
			sessionId: created.sessionId,
			gameNumber: created.gameNumber,
			status: created.status as "scheduled" | "in_progress" | "completed",
			winner: created.winner,
			players: created.MatchGamePlayer.map((p) => ({
				id: p.id,
				userId: p.userId,
				playerName: p.playerName,
				team: p.team,
				position: p.position,
				score: p.score,
			})),
			createdAt: created.createdAt,
			updatedAt: created.updatedAt,
		});
	}

	async findGameById(gameId: string): Promise<MatchGame | null> {
		const game = await this.prisma.matchGame.findUnique({
			where: { id: gameId },
			include: {
				MatchGamePlayer: { orderBy: { position: "asc" } },
			},
		});

		if (!game) return null;

		return MatchGame.create({
			id: game.id,
			sessionId: game.sessionId,
			gameNumber: game.gameNumber,
			status: game.status as "scheduled" | "in_progress" | "completed",
			winner: game.winner,
			players: game.MatchGamePlayer.map((p) => ({
				id: p.id,
				userId: p.userId,
				playerName: p.playerName,
				team: p.team,
				position: p.position,
				score: p.score,
			})),
			createdAt: game.createdAt,
			updatedAt: game.updatedAt,
		});
	}

	async findGamesBySessionId(sessionId: string): Promise<MatchGame[]> {
		const games = await this.prisma.matchGame.findMany({
			where: { sessionId },
			include: {
				MatchGamePlayer: {
					orderBy: { position: "asc" },
				},
			},
			orderBy: { gameNumber: "asc" },
		});

		return games.map((game) =>
			MatchGame.create({
				id: game.id,
				sessionId: game.sessionId,
				gameNumber: game.gameNumber,
				status: game.status as "scheduled" | "in_progress" | "completed",
				winner: game.winner,
				players: game.MatchGamePlayer.map((p) => ({
					id: p.id,
					userId: p.userId,
					playerName: p.playerName,
					team: p.team,
					position: p.position,
					score: p.score,
				})),
				createdAt: game.createdAt,
				updatedAt: game.updatedAt,
			}),
		);
	}

	async updateGame(game: MatchGame): Promise<MatchGame> {
		// Update game and players in a transaction
		const updated = await this.prisma.$transaction(async (tx) => {
			// Update game
			const _updatedGame = await tx.matchGame.update({
				where: { id: game.id },
				data: {
					status: game.status,
					winner: game.winner,
				},
			});

			// Update players
			await Promise.all(
				game.players.map((player) =>
					tx.matchGamePlayer.update({
						where: { id: player.id },
						data: {
							score: player.score,
						},
					}),
				),
			);

			// Fetch updated game with players
			return await tx.matchGame.findUnique({
				where: { id: game.id },
				include: {
					MatchGamePlayer: {
						orderBy: { position: "asc" },
					},
				},
			});
		});

		if (!updated) {
			throw new Error("Failed to update game");
		}

		return MatchGame.create({
			id: updated.id,
			sessionId: updated.sessionId,
			gameNumber: updated.gameNumber,
			status: updated.status as "scheduled" | "in_progress" | "completed",
			winner: updated.winner,
			players: updated.MatchGamePlayer.map((p) => ({
				id: p.id,
				userId: p.userId,
				playerName: p.playerName,
				team: p.team,
				position: p.position,
				score: p.score,
			})),
			createdAt: updated.createdAt,
			updatedAt: updated.updatedAt,
		});
	}
}

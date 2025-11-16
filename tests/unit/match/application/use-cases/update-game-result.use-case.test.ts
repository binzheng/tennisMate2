import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateGameResultUseCase } from "~/modules/match/application/use-cases/update-game-result.use-case";
import type { MatchSessionRepository } from "~/modules/match/domain/repositories/match-session.repository.interface";
import { MatchGame } from "~/modules/match/domain/entities/match-game.entity";

function repoMock(): Record<keyof MatchSessionRepository, any> {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    findByCreatedBy: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    createGame: vi.fn(),
    findGameById: vi.fn(),
    findGamesBySessionId: vi.fn(),
    updateGame: vi.fn(),
  } as any;
}

describe("UpdateGameResultUseCase", () => {
  let repo: MatchSessionRepository & ReturnType<typeof repoMock>;

  beforeEach(() => {
    repo = repoMock() as any;
  });

  it("ゲームが存在しない場合はエラー", async () => {
    repo.findGameById.mockResolvedValue(null);
    const useCase = new UpdateGameResultUseCase(repo);

    await expect(
      useCase.execute({
        gameId: "g-not-found",
        playerScores: [],
        winner: 1,
      }),
    ).rejects.toThrow("ゲームが見つかりません");
    expect(repo.updateGame).not.toHaveBeenCalled();
  });

  it("既に確定済みのゲームは更新できない", async () => {
    const game = MatchGame.create({
      id: "g1",
      sessionId: "s1",
      gameNumber: 1,
      status: "completed",
      winner: 1,
      players: [],
    });
    repo.findGameById.mockResolvedValue(game);

    const useCase = new UpdateGameResultUseCase(repo);
    await expect(
      useCase.execute({
        gameId: "g1",
        playerScores: [],
        winner: 1,
      }),
    ).rejects.toThrow("このゲームは既に結果が確定しています");
  });

  it("スコア更新と勝者判定が行われる", async () => {
    const game = MatchGame.create({
      id: "g2",
      sessionId: "s1",
      gameNumber: 1,
      status: "scheduled",
      winner: null,
      players: [
        {
          id: "p1",
          userId: "u1",
          playerName: "プレイヤー1",
          team: 1,
          position: 0,
          score: null,
        },
        {
          id: "p2",
          userId: "u2",
          playerName: "プレイヤー2",
          team: 2,
          position: 1,
          score: null,
        },
      ],
    });
    repo.findGameById.mockResolvedValue(game);
    repo.updateGame.mockImplementation(async (g: MatchGame) => g);

    const useCase = new UpdateGameResultUseCase(repo);
    await useCase.execute({
      gameId: "g2",
      playerScores: [
        { playerId: "p1", score: 60 },
        { playerId: "p2", score: 30 },
      ],
      winner: 1,
    });

    expect(repo.updateGame).toHaveBeenCalledTimes(1);
    const updated = (repo.updateGame as any).mock.calls[0][0] as MatchGame;
    expect(updated.status).toBe("completed");
    expect(updated.winner).toBe(1);
  });
});


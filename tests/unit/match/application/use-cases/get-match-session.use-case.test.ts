import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetMatchSessionUseCase } from "~/modules/match/application/use-cases/get-match-session.use-case";
import type { MatchSessionRepository } from "~/modules/match/domain/repositories/match-session.repository.interface";
import { MatchSession } from "~/modules/match/domain/entities/match-session.entity";
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

describe("GetMatchSessionUseCase", () => {
  let repo: MatchSessionRepository & ReturnType<typeof repoMock>;

  beforeEach(() => {
    repo = repoMock() as any;
  });

  it("存在しないIDの場合は null を返す", async () => {
    repo.findById.mockResolvedValue(null);
    const useCase = new GetMatchSessionUseCase(repo);
    const out = await useCase.execute("not-found");
    expect(out).toBeNull();
  });

  it("セッションとゲーム一覧を取得して返す", async () => {
    const session = MatchSession.create({
      id: "s1",
      name: "セッション1",
      date: new Date("2024-01-01T00:00:00Z"),
      playerCount: 4,
      createdBy: "user-1",
    });
    const game = MatchGame.create({
      id: "g1",
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
      ],
    });

    repo.findById.mockResolvedValue(session);
    repo.findGamesBySessionId.mockResolvedValue([game]);

    const useCase = new GetMatchSessionUseCase(repo);
    const out = await useCase.execute("s1");

    expect(repo.findById).toHaveBeenCalledWith("s1");
    expect(repo.findGamesBySessionId).toHaveBeenCalledWith("s1");
    expect(out).not.toBeNull();
    expect(out?.games).toHaveLength(1);
    expect(out?.games[0]).toMatchObject({
      id: "g1",
      gameNumber: 1,
      status: "scheduled",
      winner: null,
    });
  });
});


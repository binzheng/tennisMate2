import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteMatchSessionUseCase } from "~/modules/match/application/use-cases/delete-match-session.use-case";
import type { MatchSessionRepository } from "~/modules/match/domain/repositories/match-session.repository.interface";
import { MatchSession } from "~/modules/match/domain/entities/match-session.entity";

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

describe("DeleteMatchSessionUseCase", () => {
  let repo: MatchSessionRepository & ReturnType<typeof repoMock>;

  beforeEach(() => {
    repo = repoMock() as any;
  });

  it("存在しないセッションはエラー", async () => {
    repo.findById.mockResolvedValue(null);
    const useCase = new DeleteMatchSessionUseCase(repo);

    await expect(
      useCase.execute({ id: "not-found" }),
    ).rejects.toThrow("セッションが見つかりません");
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it("存在するセッションは削除が呼ばれる", async () => {
    const session = MatchSession.create({
      id: "s1",
      name: "セッション1",
      date: new Date("2024-01-01T00:00:00Z"),
      playerCount: 4,
      createdBy: "user-1",
    });
    repo.findById.mockResolvedValue(session);

    const useCase = new DeleteMatchSessionUseCase(repo);
    await useCase.execute({ id: "s1" });

    expect(repo.delete).toHaveBeenCalledWith("s1");
  });
});


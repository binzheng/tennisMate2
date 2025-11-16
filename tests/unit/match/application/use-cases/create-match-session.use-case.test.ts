import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateMatchSessionUseCase } from "~/modules/match/application/use-cases/create-match-session.use-case";
import type { MatchSessionRepository } from "~/modules/match/domain/repositories/match-session.repository.interface";
import { MatchSession } from "~/modules/match/domain/entities/match-session.entity";
import { MatchGame } from "~/modules/match/domain/entities/match-game.entity";

vi.mock("nanoid", () => ({ nanoid: () => "new-session-id" }));

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

describe("CreateMatchSessionUseCase", () => {
  let repo: MatchSessionRepository & ReturnType<typeof repoMock>;

  beforeEach(() => {
    repo = repoMock() as any;
    repo.create.mockImplementation(async (session: MatchSession) => session);
    repo.createGame.mockImplementation(async (game: MatchGame) => game);
  });

  it("セッション名が空の場合はエラー", async () => {
    const useCase = new CreateMatchSessionUseCase(repo);
    await expect(
      useCase.execute({
        name: "",
        date: new Date(),
        players: [],
        createdBy: "user-1",
      }),
    ).rejects.toThrow("セッション名は必須です");
  });

  it("プレイヤーが4人未満の場合はエラー", async () => {
    const useCase = new CreateMatchSessionUseCase(repo);
    await expect(
      useCase.execute({
        name: "テストセッション",
        date: new Date(),
        players: [
          { id: "p1", name: "プレイヤー1", userId: null },
          { id: "p2", name: "プレイヤー2", userId: null },
          { id: "p3", name: "プレイヤー3", userId: null },
        ],
        createdBy: "user-1",
      }),
    ).rejects.toThrow("最低4人のプレイヤーが必要です");
  });

  it("正常にセッションを作成し、ゲームも作成される", async () => {
    const useCase = new CreateMatchSessionUseCase(repo);

    const result = await useCase.execute({
      name: "テストセッション",
      date: new Date("2024-01-01T00:00:00Z"),
      players: [
        { id: "p1", name: "プレイヤー1", userId: "u1" },
        { id: "p2", name: "プレイヤー2", userId: "u2" },
        { id: "p3", name: "プレイヤー3", userId: "u3" },
        { id: "p4", name: "プレイヤー4", userId: "u4" },
      ],
      createdBy: "user-1",
    });

    expect(repo.create).toHaveBeenCalledTimes(1);
    expect(repo.createGame).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: "new-session-id",
      name: "テストセッション",
      playerCount: 4,
      createdBy: "user-1",
    });
  });
});


import { describe, it, expect, vi } from "vitest";
import { GetAllSessionsUseCase } from "~/modules/match/application/use-cases/get-all-sessions.use-case";
import type { MatchSessionRepository } from "~/modules/match/domain/repositories/match-session.repository.interface";
import { MatchSession } from "~/modules/match/domain/entities/match-session.entity";

describe("GetAllSessionsUseCase", () => {
  it("全件取得しセッションサマリ配列へマッピング", async () => {
    const repo = {
      findAll: vi.fn(),
    } as unknown as MatchSessionRepository & {
      findAll: ReturnType<typeof vi.fn>;
    };

    const sessions = [
      MatchSession.create({
        id: "s1",
        name: "セッション1",
        date: new Date("2024-01-01T00:00:00Z"),
        playerCount: 4,
        createdBy: "user-1",
      }),
      MatchSession.create({
        id: "s2",
        name: "セッション2",
        date: new Date("2024-01-02T00:00:00Z"),
        playerCount: 8,
        createdBy: "user-2",
      }),
    ];
    (repo.findAll as any).mockResolvedValue(sessions);

    const useCase = new GetAllSessionsUseCase(repo);
    const out = await useCase.execute();

    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ id: "s1", name: "セッション1" });
    expect(out[1]).toMatchObject({ id: "s2", name: "セッション2" });
  });
});


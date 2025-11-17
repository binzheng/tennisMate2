import { describe, it, expect } from "vitest";
import { MatchGame } from "~/modules/match/domain/entities/match-game.entity";

describe("MatchGame Entity", () => {
  it("create: 正常系でエンティティを生成し、値が保持される", () => {
    const now = new Date("2024-01-01T00:00:00Z");
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
        {
          id: "p2",
          userId: "u2",
          playerName: "プレイヤー2",
          team: 2,
          position: 1,
          score: null,
        },
      ],
      createdAt: now,
      updatedAt: now,
    });

    expect(game.id).toBe("g1");
    expect(game.sessionId).toBe("s1");
    expect(game.gameNumber).toBe(1);
    expect(game.status).toBe("scheduled");
    expect(game.winner).toBeNull();
    expect(game.players).toHaveLength(2);
    expect(game.players[0]).toMatchObject({
      id: "p1",
      userId: "u1",
      playerName: "プレイヤー1",
      team: 1,
      position: 0,
      score: null,
    });
  });

  it("create: createdAt/updatedAt 未指定時に現在時刻が設定される", () => {
    const game = MatchGame.create({
      id: "g2",
      sessionId: "s1",
      gameNumber: 2,
      status: "scheduled",
      winner: null,
      players: [],
    });

    expect(game.createdAt).toBeInstanceOf(Date);
    expect(game.updatedAt).toBeInstanceOf(Date);
  });
});


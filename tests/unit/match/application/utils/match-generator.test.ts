import { describe, it, expect } from "vitest";
import {
  generateMatches,
  generateDummyPlayers,
  type PlayerInfo,
} from "~/modules/match/application/utils/match-generator";

describe("match-generator", () => {
  it("4人未満の場合はエラー", () => {
    const players: PlayerInfo[] = [
      { id: "p1", name: "プレイヤー1", userId: null },
      { id: "p2", name: "プレイヤー2", userId: null },
      { id: "p3", name: "プレイヤー3", userId: null },
    ];

    expect(() => generateMatches(players)).toThrow(
      "最低4人のプレイヤーが必要です",
    );
  });

  it("4人の場合は休み無しで3試合生成される", () => {
    const players: PlayerInfo[] = generateDummyPlayers(4);
    const matches = generateMatches(players);

    expect(matches).toHaveLength(3);
    for (const match of matches) {
      expect(match.restingPlayers).toHaveLength(0);
      expect(match.team1).toHaveLength(2);
      expect(match.team2).toHaveLength(2);
    }
  });

  it("5人以上の場合は各試合に休みプレイヤーが含まれる", () => {
    const players: PlayerInfo[] = generateDummyPlayers(5);
    const matches = generateMatches(players);

    expect(matches.length).toBeGreaterThan(0);
    for (const match of matches) {
      expect(match.restingPlayers.length).toBeGreaterThanOrEqual(1);
    }
  });
});


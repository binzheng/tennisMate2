import { describe, it, expect } from "vitest";
import { MatchSession } from "~/modules/match/domain/entities/match-session.entity";

describe("MatchSession Entity", () => {
  it("create: 正常系でエンティティを生成し、値が保持される", () => {
    const now = new Date("2024-01-01T00:00:00Z");
    const session = MatchSession.create({
      id: "s1",
      name: "セッション1",
      date: now,
      playerCount: 8,
      createdBy: "user-1",
      createdAt: now,
      updatedAt: now,
    });

    expect(session.id).toBe("s1");
    expect(session.name).toBe("セッション1");
    expect(session.date).toBe(now);
    expect(session.playerCount).toBe(8);
    expect(session.createdBy).toBe("user-1");
    expect(session.createdAt).toBe(now);
    expect(session.updatedAt).toBe(now);
  });

  it("create: createdAt/updatedAt 未指定時に現在時刻が設定される", () => {
    const before = new Date();
    const session = MatchSession.create({
      id: "s2",
      name: "セッション2",
      date: new Date("2024-02-01T00:00:00Z"),
      playerCount: 4,
      createdBy: "user-2",
    });
    const after = new Date();

    expect(session.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(session.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(session.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(session.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("toPublicData: DTOへ変換される", () => {
    const now = new Date("2024-03-01T00:00:00Z");
    const session = MatchSession.create({
      id: "s3",
      name: "セッション3",
      date: now,
      playerCount: 6,
      createdBy: "user-3",
      createdAt: now,
      updatedAt: now,
    });

    expect(session.toPublicData()).toEqual({
      id: "s3",
      name: "セッション3",
      date: now,
      playerCount: 6,
      createdBy: "user-3",
      createdAt: now,
      updatedAt: now,
    });
  });
});


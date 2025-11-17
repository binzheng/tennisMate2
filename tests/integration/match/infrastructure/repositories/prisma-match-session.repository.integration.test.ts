import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
import { PrismaMatchSessionRepository } from "~/modules/match/infrastructure/repositories/prisma-match-session.repository";
import { MatchSession } from "~/modules/match/domain/entities/match-session.entity";
import { MatchGame } from "~/modules/match/domain/entities/match-game.entity";
import {
  getTestDb,
  cleanupDatabase,
  disconnectDb,
} from "../../../../helpers/db-helper";

const db = getTestDb();

describe("PrismaMatchSessionRepository Integration Test", () => {
  let repository: PrismaMatchSessionRepository;

  beforeEach(async () => {
    await cleanupDatabase();
    repository = new PrismaMatchSessionRepository(db);
  });

  afterEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await disconnectDb();
  });

  describe("create/findById", () => {
    it("セッションを作成し取得できる", async () => {
      const now = new Date("2024-01-01T00:00:00Z");
      const session = MatchSession.create({
        id: "session-1",
        name: "テストセッション1",
        date: now,
        playerCount: 4,
        createdBy: "user-1",
      });

      const created = await repository.create(session);
      expect(created.id).toBe("session-1");
      expect(created.name).toBe("テストセッション1");

      const found = await repository.findById("session-1");
      expect(found).not.toBeNull();
      expect(found?.id).toBe("session-1");
      expect(found?.playerCount).toBe(4);
    });
  });

  describe("findAll/findByCreatedBy/update/delete", () => {
    it("一覧・作成者別取得・更新・削除ができる", async () => {
      const s1 = MatchSession.create({
        id: "session-1",
        name: "セッション1",
        date: new Date("2024-01-01T00:00:00Z"),
        playerCount: 4,
        createdBy: "user-1",
      });
      const s2 = MatchSession.create({
        id: "session-2",
        name: "セッション2",
        date: new Date("2024-01-02T00:00:00Z"),
        playerCount: 8,
        createdBy: "user-2",
      });

      await repository.create(s1);
      await repository.create(s2);

      const all = await repository.findAll();
      expect(all.length).toBe(2);

      const byUser1 = await repository.findByCreatedBy("user-1");
      expect(byUser1.length).toBe(1);
      expect(byUser1[0]?.id).toBe("session-1");

      const updatedEntity = MatchSession.create({
        id: "session-1",
        name: "更新後セッション",
        date: new Date("2024-01-03T00:00:00Z"),
        playerCount: 6,
        createdBy: "user-1",
      });
      const updated = await repository.update(updatedEntity);
      expect(updated.name).toBe("更新後セッション");
      expect(updated.playerCount).toBe(6);

      await repository.delete("session-2");
      const afterDeleteAll = await repository.findAll();
      expect(afterDeleteAll.some((s) => s.id === "session-2")).toBe(false);
    });
  });

  describe("createGame/findGameById/findGamesBySessionId/updateGame", () => {
    it("ゲームの作成・取得・更新ができる", async () => {
      const session = MatchSession.create({
        id: "session-1",
        name: "セッション1",
        date: new Date("2024-01-01T00:00:00Z"),
        playerCount: 4,
        createdBy: "user-1",
      });
      await repository.create(session);

      const game = MatchGame.create({
        id: "game-1",
        sessionId: "session-1",
        gameNumber: 1,
        status: "scheduled",
        winner: null,
        players: [
          {
            id: "player-1",
            userId: null,
            playerName: "プレイヤー1",
            team: 1,
            position: 0,
            score: null,
          },
          {
            id: "player-2",
            userId: null,
            playerName: "プレイヤー2",
            team: 2,
            position: 1,
            score: null,
          },
        ],
      });

      const createdGame = await repository.createGame(game);
      expect(createdGame.id).toBe("game-1");
      expect(createdGame.players).toHaveLength(2);

      const foundGame = await repository.findGameById("game-1");
      expect(foundGame).not.toBeNull();
      expect(foundGame?.id).toBe("game-1");
      expect(foundGame?.players[0]?.playerName).toBe("プレイヤー1");

      const gamesBySession = await repository.findGamesBySessionId("session-1");
      expect(gamesBySession.length).toBe(1);
      expect(gamesBySession[0]?.id).toBe("game-1");

      const updatedGameEntity = MatchGame.create({
        id: "game-1",
        sessionId: "session-1",
        gameNumber: 1,
        status: "completed",
        winner: 1,
        players: [
          {
            id: "player-1",
            userId: null,
            playerName: "プレイヤー1",
            team: 1,
            position: 0,
            score: 60,
          },
          {
            id: "player-2",
            userId: null,
            playerName: "プレイヤー2",
            team: 2,
            position: 1,
            score: 30,
          },
        ],
      });

      const updatedGame = await repository.updateGame(updatedGameEntity);
      expect(updatedGame.status).toBe("completed");
      expect(updatedGame.winner).toBe(1);
      expect(updatedGame.players[0]?.score).toBe(60);
    });
  });
});


import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { PrismaLessonRepository } from "~/modules/lesson/infrastructure/repositories/prisma-lesson.repository";
import { Lesson } from "~/modules/lesson/domain/entities/lesson.entity";
import {
  getTestDb,
  cleanupDatabase,
  disconnectDb,
} from "../../../../helpers/db-helper";

const db = getTestDb();

async function seedFacilityAndCourt() {
  const facilityId = "fac-1";
  const courtId = "court-1";

  // 既存のコートとファシリティを確認して、なければ作成
  const existingFacility = await db.facility.findUnique({ where: { id: facilityId } });
  if (!existingFacility) {
    await db.facility.create({ data: { id: facilityId, name: "施設A", updatedAt: new Date() } });
  }

  const existingCourt = await db.court.findUnique({ where: { id: courtId } });
  if (!existingCourt) {
    await db.court.create({ data: { id: courtId, name: "Aコート", facilityId } });
  }
}

function calcEndTime(startTime: string, duration: string): string {
  const [h, m] = startTime.split(":").map(Number);
  const add = Number.parseInt(duration, 10);
  const total = (h ?? 0) * 60 + (m ?? 0) + add;
  const eh = Math.floor(total / 60);
  const em = total % 60;
  return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
}

describe("PrismaLessonRepository Integration Test", () => {
  let repository: PrismaLessonRepository;

  beforeEach(async () => {
    await cleanupDatabase();
    await seedFacilityAndCourt();
    repository = new PrismaLessonRepository(db);
  });

  afterAll(async () => {
    await cleanupDatabase();
    await disconnectDb();
  });

  describe("create/find", () => {
    it("レッスンを作成し取得できる", async () => {
      const startTime = "09:00";
      const duration = "90";
      const endTime = calcEndTime(startTime, duration);

      const lesson = Lesson.create({
        id: "slot_1",
        courtId: "court-1",
        coachId: null,
        capacity: 4,
        dayOfWeek: "monday",
        startTime,
        endTime,
        duration,
      });

      const created = await repository.create(lesson);
      expect(created.startTime).toBe("09:00");
      expect(created.endTime).toBe("10:30");

      const found = await repository.findById("slot_1");
      expect(found).not.toBeNull();
      expect(found?.id).toBe("slot_1");
    });
  });

  describe("findAll/update/delete", () => {
    it("一覧・更新・削除ができる", async () => {
      const s1 = Lesson.create({
        id: "slot_1",
        courtId: "court-1",
        coachId: null,
        capacity: 4,
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: calcEndTime("09:00", "90"),
        duration: "90",
      });
      const created = await repository.create(s1);
      expect(created.id).toBe("slot_1");

      const list1 = await repository.findAll();
      expect(list1.length).toBe(1);
      expect(list1[0]?.courtId).toBe("court-1");

      // データが存在することを確認
      const beforeUpdate = await repository.findById("slot_1");
      expect(beforeUpdate).not.toBeNull();
      expect(beforeUpdate?.startTime).toBe("09:00");

      // update startTime -> endTime も更新済で渡す
      const updatedEntity = Lesson.create({
        id: "slot_1",
        courtId: "court-1",
        coachId: null,
        capacity: 4,
        dayOfWeek: "monday",
        startTime: "10:00",
        endTime: calcEndTime("10:00", "90"),
        duration: "90",
      });
      const updated = await repository.update(updatedEntity);
      expect(updated.startTime).toBe("10:00");
      expect(updated.endTime).toBe("11:30");

      await repository.delete("slot_1");
      const after = await repository.findAll();
      expect(after.length).toBe(0);
    });
  });
});

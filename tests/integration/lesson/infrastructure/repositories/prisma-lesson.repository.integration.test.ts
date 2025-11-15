import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";
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

  // cleanupDatabase() の後なので、直接作成できる
  await db.facility.create({
    data: { id: facilityId, name: "施設A", updatedAt: new Date() }
  });
  await db.court.create({
    data: { id: courtId, name: "Aコート", facilityId }
  });
}

async function seedMultipleCourts() {
  const facilityId = "fac-1";

  // 親のbeforeEachで既にfacilityとcourt-1が作成されているので、court-2のみ追加
  await db.court.create({ data: { id: "court-2", name: "court-2", facilityId } });
}

async function seedCoach() {
  await db.user.create({
    data: {
      id: "coach-1",
      name: "コーチ太郎",
      email: "coach@example.com",
      passwordHash: "hashed_password",
      role: "coach",
    },
  });
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

  afterEach(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
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

  describe("findById", () => {
    it("存在しないIDの場合はnullを返す", async () => {
      const notFound = await repository.findById("non-existent-id");
      expect(notFound).toBeNull();
    });
  });

  describe("findByCourtId", () => {
    beforeEach(async () => {
      await seedMultipleCourts();
    });

    it("指定したコートIDのレッスンのみ取得できる", async () => {
      // court-1 に2つのレッスンを作成
      const lesson1 = Lesson.create({
        id: "slot_1",
        courtId: "court-1",
        coachId: null,
        capacity: 4,
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: calcEndTime("09:00", "90"),
        duration: "90",
      });
      await repository.create(lesson1);

      const lesson2 = Lesson.create({
        id: "slot_2",
        courtId: "court-1",
        coachId: null,
        capacity: 4,
        dayOfWeek: "tuesday",
        startTime: "10:00",
        endTime: calcEndTime("10:00", "90"),
        duration: "90",
      });
      await repository.create(lesson2);

      // court-2 に1つのレッスンを作成
      const lesson3 = Lesson.create({
        id: "slot_3",
        courtId: "court-2",
        coachId: null,
        capacity: 4,
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: calcEndTime("09:00", "90"),
        duration: "90",
      });
      await repository.create(lesson3);

      // court-1 のレッスンのみ取得
      const court1Lessons = await repository.findByCourtId("court-1");
      expect(court1Lessons.length).toBe(2);
      expect(court1Lessons.every((l) => l.courtId === "court-1")).toBe(true);

      // court-2 のレッスンのみ取得
      const court2Lessons = await repository.findByCourtId("court-2");
      expect(court2Lessons.length).toBe(1);
      expect(court2Lessons[0]?.courtId).toBe("court-2");
    });

    it("該当するコートのレッスンがない場合は空配列を返す", async () => {
      const lessons = await repository.findByCourtId("non-existent-court");
      expect(lessons).toEqual([]);
    });
  });

  describe("findByCoachId", () => {
    beforeEach(async () => {
      await seedCoach();
    });

    it("指定したコーチIDのレッスンのみ取得できる", async () => {
      // coach-1 のレッスンを作成
      const lesson1 = Lesson.create({
        id: "slot_1",
        courtId: "court-1",
        coachId: "coach-1",
        capacity: 4,
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: calcEndTime("09:00", "90"),
        duration: "90",
      });
      await repository.create(lesson1);

      const lesson2 = Lesson.create({
        id: "slot_2",
        courtId: "court-1",
        coachId: "coach-1",
        capacity: 4,
        dayOfWeek: "tuesday",
        startTime: "10:00",
        endTime: calcEndTime("10:00", "90"),
        duration: "90",
      });
      await repository.create(lesson2);

      // コーチなしのレッスンを作成
      const lesson3 = Lesson.create({
        id: "slot_3",
        courtId: "court-1",
        coachId: null,
        capacity: 4,
        dayOfWeek: "wednesday",
        startTime: "09:00",
        endTime: calcEndTime("09:00", "90"),
        duration: "90",
      });
      await repository.create(lesson3);

      // coach-1 のレッスンのみ取得
      const coachLessons = await repository.findByCoachId("coach-1");
      expect(coachLessons.length).toBe(2);
      expect(coachLessons.every((l) => l.coachId === "coach-1")).toBe(true);
    });

    it("該当するコーチのレッスンがない場合は空配列を返す", async () => {
      const lessons = await repository.findByCoachId("non-existent-coach");
      expect(lessons).toEqual([]);
    });
  });

  describe("findByCourtDayTime", () => {
    it("コート・曜日・時間帯で一意にレッスンを取得できる", async () => {
      const lesson = Lesson.create({
        id: "slot_1",
        courtId: "court-1",
        coachId: null,
        capacity: 4,
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: calcEndTime("09:00", "90"),
        duration: "90",
      });
      await repository.create(lesson);

      const found = await repository.findByCourtDayTime("court-1", "monday", "09:00");
      expect(found).not.toBeNull();
      expect(found?.id).toBe("slot_1");
      expect(found?.courtId).toBe("court-1");
      expect(found?.dayOfWeek).toBe("monday");
      expect(found?.startTime).toBe("09:00");
    });

    it("該当するレッスンがない場合はnullを返す", async () => {
      const notFound = await repository.findByCourtDayTime("court-1", "monday", "09:00");
      expect(notFound).toBeNull();
    });
  });

  describe("findByCourtAndDay", () => {
    it("指定したコートと曜日のレッスンを取得できる", async () => {
      // このテストのためにコートが必要
      // beforeEachで既にseedFacilityAndCourt()が呼ばれているので court-1 は存在する
      // 同じコート・曜日で複数のレッスンを作成
      const lesson1 = Lesson.create({
        id: "slot_1",
        courtId: "court-1",
        coachId: null,
        capacity: 4,
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: calcEndTime("09:00", "90"),
        duration: "90",
      });
      await repository.create(lesson1);

      const lesson2 = Lesson.create({
        id: "slot_2",
        courtId: "court-1",
        coachId: null,
        capacity: 4,
        dayOfWeek: "monday",
        startTime: "11:00",
        endTime: calcEndTime("11:00", "90"),
        duration: "90",
      });
      await repository.create(lesson2);

      // 異なる曜日のレッスン
      const lesson3 = Lesson.create({
        id: "slot_3",
        courtId: "court-1",
        coachId: null,
        capacity: 4,
        dayOfWeek: "tuesday",
        startTime: "09:00",
        endTime: calcEndTime("09:00", "90"),
        duration: "90",
      });
      await repository.create(lesson3);

      const mondayLessons = await repository.findByCourtAndDay("court-1", "monday");
      expect(mondayLessons.length).toBe(2);
      expect(mondayLessons.every((l) => l.courtId === "court-1" && l.dayOfWeek === "monday")).toBe(true);
      // 開始時刻順にソートされていることを確認
      expect(mondayLessons[0]?.startTime).toBe("09:00");
      expect(mondayLessons[1]?.startTime).toBe("11:00");
    });

    it("該当するレッスンがない場合は空配列を返す", async () => {
      const lessons = await repository.findByCourtAndDay("court-1", "monday");
      expect(lessons).toEqual([]);
    });
  });
});

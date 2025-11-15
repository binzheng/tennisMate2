import { describe, it, expect } from "vitest";
import { Lesson } from "~/modules/lesson/domain/entities/lesson.entity";

describe("Lesson Entity", () => {
  it("create: 正常系でエンティティを生成し、値が保持される", () => {
    const now = new Date("2024-01-01T00:00:00Z");
    const lesson = Lesson.create({
      id: "l1",
      courtId: "c1",
      coachId: null,
      capacity: 4,
      dayOfWeek: "monday",
      startTime: "09:00",
      endTime: "10:30",
      duration: "90",
      createdAt: now,
    });

    expect(lesson.id).toBe("l1");
    expect(lesson.courtId).toBe("c1");
    expect(lesson.capacity).toBe(4);
    expect(lesson.startTime).toBe("09:00");
    expect(lesson.endTime).toBe("10:30");
    expect(lesson.duration).toBe("90");
    expect(lesson.createdAt).toBe(now);
  });

  it("create: 定員が1未満はエラー", () => {
    expect(() =>
      Lesson.create({
        id: "l1",
        courtId: "c1",
        coachId: null,
        capacity: 0,
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: "10:00",
        duration: "60",
      }),
    ).toThrow("定員は1以上である必要があります");
  });

  it("create: 開始が終了以降はエラー", () => {
    expect(() =>
      Lesson.create({
        id: "l1",
        courtId: "c1",
        coachId: null,
        capacity: 1,
        dayOfWeek: "monday",
        startTime: "11:00",
        endTime: "10:00",
        duration: "60",
      }),
    ).toThrow("開始時刻は終了時刻より前である必要があります");
  });

  it("canBeBooked: 予約数が定員未満なら予約可能", () => {
    const lesson = Lesson.create({
      id: "l1",
      courtId: "c1",
      coachId: null,
      capacity: 2,
      dayOfWeek: "monday",
      startTime: "09:00",
      endTime: "10:00",
      duration: "60",
    });
    expect(lesson.canBeBooked(0)).toBe(true);
    expect(lesson.canBeBooked(1)).toBe(true);
    expect(lesson.canBeBooked(2)).toBe(false);
  });

  it("toPublicData: DTOへ変換", () => {
    const createdAt = new Date("2024-01-01T00:00:00Z");
    const lesson = Lesson.create({
      id: "l1",
      courtId: "c1",
      coachId: "coach1",
      capacity: 3,
      dayOfWeek: "tuesday",
      startTime: "10:00",
      endTime: "11:00",
      duration: "60",
      createdAt,
    });
    expect(lesson.toPublicData()).toEqual({
      id: "l1",
      courtId: "c1",
      coachId: "coach1",
      capacity: 3,
      dayOfWeek: "tuesday",
      startTime: "10:00",
      endTime: "11:00",
      duration: "60",
      createdAt,
    });
  });
});


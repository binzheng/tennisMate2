import { describe, it, expect, vi } from "vitest";
import { GetAllLessonsUseCase } from "~/modules/lesson/application/use-cases/get-all-lessons.use-case";
import type { LessonRepository } from "~/modules/lesson/domain/repositories/lesson.repository.interface";
import { Lesson } from "~/modules/lesson/domain/entities/lesson.entity";

describe("GetAllLessonsUseCase", () => {
  it("全件取得しDTO配列へマッピング", async () => {
    const repo = {
      findAll: vi.fn(),
    } as unknown as LessonRepository & { findAll: ReturnType<typeof vi.fn> };

    const lessons = [
      Lesson.create({
        id: "l1",
        courtId: "c1",
        coachId: null,
        capacity: 4,
        dayOfWeek: "monday",
        startTime: "09:00",
        endTime: "10:00",
        duration: "60",
      }),
      Lesson.create({
        id: "l2",
        courtId: "c2",
        coachId: null,
        capacity: 6,
        dayOfWeek: "tuesday",
        startTime: "10:00",
        endTime: "11:30",
        duration: "90",
      }),
    ];
    (repo.findAll as any).mockResolvedValue(lessons);

    const useCase = new GetAllLessonsUseCase(repo);
    const out = await useCase.execute();
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ id: "l1", courtId: "c1" });
    expect(out[1]).toMatchObject({ id: "l2", courtId: "c2" });
  });
});


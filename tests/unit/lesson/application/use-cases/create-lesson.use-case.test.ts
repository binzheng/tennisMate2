import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateLessonUseCase } from "~/modules/lesson/application/use-cases/create-lesson.use-case";
import type { LessonRepository } from "~/modules/lesson/domain/repositories/lesson.repository.interface";
import { Lesson } from "~/modules/lesson/domain/entities/lesson.entity";

// Fix nanoid to deterministic value
vi.mock("nanoid", () => ({ nanoid: () => "new-lesson-id" }));

function repoMock(): Record<keyof LessonRepository, any> {
  return {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByCourtId: vi.fn(),
    findByCoachId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByCourtDayTime: vi.fn(),
    findByCourtAndDay: vi.fn(),
  } as any;
}

describe("CreateLessonUseCase", () => {
  let repo: LessonRepository & ReturnType<typeof repoMock>;

  beforeEach(() => {
    repo = repoMock() as any;
  });

  it("重複が無ければ作成し、終了時刻を計算する", async () => {
    repo.findByCourtAndDay.mockResolvedValue([]);

    // Echo back the entity that was passed to create
    repo.create.mockImplementation(async (lesson: Lesson) => lesson);

    const useCase = new CreateLessonUseCase(repo);
    const result = await useCase.execute({
      courtId: "court-1",
      coachId: null,
      capacity: 4,
      dayOfWeek: "monday",
      startTime: "09:00",
      duration: "90",
    });

    expect(repo.findByCourtAndDay).toHaveBeenCalledWith("court-1", "monday");
    expect(repo.create).toHaveBeenCalledTimes(1);
    // End time should be 10:30
    expect(result).toMatchObject({
      id: "new-lesson-id",
      courtId: "court-1",
      capacity: 4,
      startTime: "09:00",
      endTime: "10:30",
      duration: "90",
    });
  });

  it("同一コート・同曜日の時間帯が重複している場合はエラー", async () => {
    // existing: 09:30 - 10:30
    const existing = Lesson.create({
      id: "ex1",
      courtId: "court-1",
      coachId: null,
      capacity: 4,
      dayOfWeek: "monday",
      startTime: "09:30",
      endTime: "10:30",
      duration: "60",
    });

    repo.findByCourtAndDay.mockResolvedValue([existing]);

    const useCase = new CreateLessonUseCase(repo);

    await expect(
      useCase.execute({
        courtId: "court-1",
        coachId: null,
        capacity: 4,
        dayOfWeek: "monday",
        startTime: "09:00",
        duration: "60", // end: 10:00 -> overlaps
      }),
    ).rejects.toThrow("重複しています");

    expect(repo.create).not.toHaveBeenCalled();
  });
});


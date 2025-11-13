import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteLessonUseCase } from "~/modules/lesson/application/use-cases/delete-lesson.use-case";
import type { LessonRepository } from "~/modules/lesson/domain/repositories/lesson.repository.interface";
import { Lesson } from "~/modules/lesson/domain/entities/lesson.entity";

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

describe("DeleteLessonUseCase", () => {
  let repo: LessonRepository & ReturnType<typeof repoMock>;

  beforeEach(() => {
    repo = repoMock() as any;
  });

  it("存在しないIDはエラー", async () => {
    repo.findById.mockResolvedValue(null);
    const useCase = new DeleteLessonUseCase(repo);
    await expect(useCase.execute("not-found")).rejects.toThrow(
      "レッスンが見つかりません",
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it("存在する場合は削除が呼ばれる", async () => {
    const lesson = Lesson.create({
      id: "l1",
      courtId: "c1",
      coachId: null,
      capacity: 4,
      dayOfWeek: "monday",
      startTime: "09:00",
      endTime: "10:00",
      duration: "60",
    });
    repo.findById.mockResolvedValue(lesson);
    const useCase = new DeleteLessonUseCase(repo);
    await useCase.execute("l1");
    expect(repo.delete).toHaveBeenCalledWith("l1");
  });
});


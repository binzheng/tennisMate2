import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateLessonUseCase } from "~/modules/lesson/application/use-cases/update-lesson.use-case";
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

const existing = Lesson.create({
  id: "lesson-1",
  courtId: "court-1",
  coachId: null,
  capacity: 4,
  dayOfWeek: "monday",
  startTime: "09:00",
  endTime: "10:00",
  duration: "60",
  createdAt: new Date("2024-01-01T00:00:00Z"),
});

describe("UpdateLessonUseCase", () => {
  let repo: LessonRepository & ReturnType<typeof repoMock>;

  beforeEach(() => {
    repo = repoMock() as any;
    repo.findById.mockResolvedValue(existing);
    repo.findByCourtAndDay.mockResolvedValue([existing]);
    // Echo the lesson updated
    repo.update.mockImplementation(async (l: Lesson) => l);
  });

  it("存在しない場合はエラー", async () => {
    repo.findById.mockResolvedValue(null);
    const useCase = new UpdateLessonUseCase(repo);
    await expect(useCase.execute({ id: "unknown" })).rejects.toThrow(
      "レッスンが見つかりません",
    );
  });

  it("capacityのみ更新（時間変更なし）", async () => {
    const useCase = new UpdateLessonUseCase(repo);
    const out = await useCase.execute({ id: "lesson-1", capacity: 6 });
    expect(out.capacity).toBe(6);
    expect(out.endTime).toBe("10:00");
    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it("開始時刻変更で終了時刻を再計算", async () => {
    const useCase = new UpdateLessonUseCase(repo);
    const out = await useCase.execute({ id: "lesson-1", startTime: "10:30" });
    // duration は既存 60 -> end 11:30
    expect(out.startTime).toBe("10:30");
    expect(out.endTime).toBe("11:30");
  });

  it("他レッスンと重複する変更はエラー", async () => {
    const another = Lesson.create({
      id: "lesson-2",
      courtId: "court-1",
      coachId: null,
      capacity: 4,
      dayOfWeek: "monday",
      startTime: "10:00",
      endTime: "11:00",
      duration: "60",
    });
    repo.findByCourtAndDay.mockResolvedValue([existing, another]);

    const useCase = new UpdateLessonUseCase(repo);
    await expect(
      useCase.execute({ id: "lesson-1", startTime: "10:30" }),
    ).rejects.toThrow("重複しています");
  });
});


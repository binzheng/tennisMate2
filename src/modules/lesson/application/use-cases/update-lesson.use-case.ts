import { Lesson } from "../../domain/entities/lesson.entity";
import type { LessonRepository } from "../../domain/repositories/lesson.repository.interface";
import type { LessonDto, UpdateLessonDto } from "../dto/lesson.dto";

/**
 * Update Lesson Use Case
 * レッスンを更新するユースケース
 */
export class UpdateLessonUseCase {
	constructor(private readonly lessonRepository: LessonRepository) {}

	async execute(dto: UpdateLessonDto): Promise<LessonDto> {
		// Find existing lesson
		const existingLesson = await this.lessonRepository.findById(dto.id);
		if (!existingLesson) {
			throw new Error("レッスンが見つかりません");
		}

		const courtId = dto.courtId ?? existingLesson.courtId;
		const dayOfWeek = dto.dayOfWeek ?? existingLesson.dayOfWeek;
		const startTime = dto.startTime ?? existingLesson.startTime;
		const duration = dto.duration ?? existingLesson.duration;

		// Calculate new end time if needed
		const endTime =
			dto.startTime !== undefined || dto.duration !== undefined
				? this.calculateEndTime(startTime, duration)
				: existingLesson.endTime;

		// Check for time slot overlap if court, day, time, or duration is being changed
		if (
			dto.courtId !== undefined ||
			dto.dayOfWeek !== undefined ||
			dto.startTime !== undefined ||
			dto.duration !== undefined
		) {
			const existingLessons = await this.lessonRepository.findByCourtAndDay(
				courtId,
				dayOfWeek,
			);

			// Check if the updated lesson overlaps with any other existing lesson
			const hasOverlap = existingLessons.some((existing) => {
				// Skip the current lesson being updated
				if (existing.id === dto.id) {
					return false;
				}

				// Check if time slots overlap
				// Overlap occurs if: (start1 < end2) AND (end1 > start2)
				return startTime < existing.endTime && endTime > existing.startTime;
			});

			if (hasOverlap) {
				throw new Error(
					"同じコート、同じ曜日の時間帯が既存のレッスンと重複しています",
				);
			}
		}

		// Create updated lesson entity
		const updatedLesson = Lesson.create({
			id: dto.id,
			courtId,
			coachId: dto.coachId !== undefined ? dto.coachId : existingLesson.coachId,
			capacity: dto.capacity ?? existingLesson.capacity,
			dayOfWeek,
			startTime,
			endTime,
			duration,
			createdAt: existingLesson.createdAt,
		});

		// Persist changes
		const savedLesson = await this.lessonRepository.update(updatedLesson);

		return savedLesson.toPublicData();
	}

	private calculateEndTime(startTime: string, duration: string): string {
		// Parse start time (HH:mm)
		const [hours, minutes] = startTime.split(":").map(Number);

		// Calculate end time
		const durationMinutes = Number.parseInt(duration, 10);
		const totalMinutes = (hours ?? 0) * 60 + (minutes ?? 0) + durationMinutes;

		const endHours = Math.floor(totalMinutes / 60);
		const endMinutes = totalMinutes % 60;

		// Format as HH:mm
		return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
	}
}

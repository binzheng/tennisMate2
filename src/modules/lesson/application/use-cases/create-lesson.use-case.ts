import { nanoid } from "nanoid";
import { Lesson } from "../../domain/entities/lesson.entity";
import type { LessonRepository } from "../../domain/repositories/lesson.repository.interface";
import type { CreateLessonDto, LessonDto } from "../dto/lesson.dto";

/**
 * Create Lesson Use Case
 * レッスンを作成するユースケース
 */
export class CreateLessonUseCase {
	constructor(private readonly lessonRepository: LessonRepository) {}

	async execute(dto: CreateLessonDto): Promise<LessonDto> {
		// Calculate end time from start time and duration
		const endTime = this.calculateEndTime(dto.startTime, dto.duration);

		// Check for time slot overlap on the same court and day
		const existingLessons = await this.lessonRepository.findByCourtAndDay(
			dto.courtId,
			dto.dayOfWeek,
		);

		// Check if the new lesson overlaps with any existing lesson
		const hasOverlap = existingLessons.some((existing) => {
			// Check if time slots overlap
			// Overlap occurs if: (start1 < end2) AND (end1 > start2)
			return dto.startTime < existing.endTime && endTime > existing.startTime;
		});

		if (hasOverlap) {
			throw new Error(
				"同じコート、同じ曜日の時間帯が既存のレッスンと重複しています",
			);
		}

		// Create lesson entity with business logic validation
		const lesson = Lesson.create({
			id: nanoid(),
			courtId: dto.courtId,
			coachId: dto.coachId,
			capacity: dto.capacity,
			dayOfWeek: dto.dayOfWeek,
			startTime: dto.startTime,
			endTime,
			duration: dto.duration,
		});

		// Persist to database
		const createdLesson = await this.lessonRepository.create(lesson);

		return createdLesson.toPublicData();
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

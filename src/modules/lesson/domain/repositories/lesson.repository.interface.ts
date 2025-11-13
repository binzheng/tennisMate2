import type { Lesson } from "../entities/lesson.entity";

/**
 * Lesson Repository Interface
 * レッスンリポジトリのインターフェース（契約）
 */
export interface LessonRepository {
	/**
	 * Find all lessons
	 */
	findAll(): Promise<Lesson[]>;

	/**
	 * Find lesson by ID
	 */
	findById(id: string): Promise<Lesson | null>;

	/**
	 * Find lessons by court ID
	 */
	findByCourtId(courtId: string): Promise<Lesson[]>;

	/**
	 * Find lessons by coach ID
	 */
	findByCoachId(coachId: string): Promise<Lesson[]>;

	/**
	 * Create a new lesson
	 */
	create(lesson: Lesson): Promise<Lesson>;

	/**
	 * Update an existing lesson
	 */
	update(lesson: Lesson): Promise<Lesson>;

	/**
	 * Delete a lesson by ID
	 */
	delete(id: string): Promise<void>;

	/**
	 * Find lesson by court, day of week, and start time
	 */
	findByCourtDayTime(
		courtId: string,
		dayOfWeek: string,
		startTime: string,
	): Promise<Lesson | null>;

	/**
	 * Find lessons by court and day of week
	 */
	findByCourtAndDay(courtId: string, dayOfWeek: string): Promise<Lesson[]>;
}

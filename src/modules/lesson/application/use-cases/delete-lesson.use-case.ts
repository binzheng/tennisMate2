import type { LessonRepository } from "../../domain/repositories/lesson.repository.interface";

/**
 * Delete Lesson Use Case
 * レッスンを削除するユースケース
 */
export class DeleteLessonUseCase {
	constructor(private readonly lessonRepository: LessonRepository) {}

	async execute(id: string): Promise<void> {
		// Check if lesson exists
		const existingLesson = await this.lessonRepository.findById(id);
		if (!existingLesson) {
			throw new Error("レッスンが見つかりません");
		}

		// Delete lesson
		await this.lessonRepository.delete(id);
	}
}

import type { LessonRepository } from "../../domain/repositories/lesson.repository.interface";
import type { LessonDto } from "../dto/lesson.dto";

/**
 * Get All Lessons Use Case
 * すべてのレッスンを取得するユースケース
 */
export class GetAllLessonsUseCase {
	constructor(private readonly lessonRepository: LessonRepository) {}

	async execute(): Promise<LessonDto[]> {
		const lessons = await this.lessonRepository.findAll();
		return lessons.map((lesson) => lesson.toPublicData());
	}
}

import type { db } from "~/server/db";
import { Lesson } from "../../domain/entities/lesson.entity";
import type { LessonRepository } from "../../domain/repositories/lesson.repository.interface";

type PrismaClient = typeof db;

/**
 * Prisma Lesson Repository
 * Prismaを使用したレッスンリポジトリの実装
 */
export class PrismaLessonRepository implements LessonRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async findAll(): Promise<Lesson[]> {
		const lessonSlots = await this.prisma.lessonSlot.findMany({
			orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
		});

		return lessonSlots.map((slot) =>
			Lesson.create({
				id: slot.id,
				courtId: slot.courtId,
				coachId: slot.coachId,
				capacity: slot.capacity,
				dayOfWeek: slot.dayOfWeek,
				startTime: slot.startTime,
				endTime: slot.endTime,
				duration: slot.duration,
				createdAt: slot.createdAt,
			}),
		);
	}

	async findById(id: string): Promise<Lesson | null> {
		const slot = await this.prisma.lessonSlot.findUnique({
			where: { id },
		});

		if (!slot) {
			return null;
		}

		return Lesson.create({
			id: slot.id,
			courtId: slot.courtId,
			coachId: slot.coachId,
			capacity: slot.capacity,
			dayOfWeek: slot.dayOfWeek,
			startTime: slot.startTime,
			endTime: slot.endTime,
			duration: slot.duration,
			createdAt: slot.createdAt,
		});
	}

	async findByCourtId(courtId: string): Promise<Lesson[]> {
		const lessonSlots = await this.prisma.lessonSlot.findMany({
			where: { courtId },
			orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
		});

		return lessonSlots.map((slot) =>
			Lesson.create({
				id: slot.id,
				courtId: slot.courtId,
				coachId: slot.coachId,
				capacity: slot.capacity,
				dayOfWeek: slot.dayOfWeek,
				startTime: slot.startTime,
				endTime: slot.endTime,
				duration: slot.duration,
				createdAt: slot.createdAt,
			}),
		);
	}

	async findByCoachId(coachId: string): Promise<Lesson[]> {
		const lessonSlots = await this.prisma.lessonSlot.findMany({
			where: { coachId },
			orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
		});

		return lessonSlots.map((slot) =>
			Lesson.create({
				id: slot.id,
				courtId: slot.courtId,
				coachId: slot.coachId,
				capacity: slot.capacity,
				dayOfWeek: slot.dayOfWeek,
				startTime: slot.startTime,
				endTime: slot.endTime,
				duration: slot.duration,
				createdAt: slot.createdAt,
			}),
		);
	}

	async findByCourtDayTime(
		courtId: string,
		dayOfWeek: string,
		startTime: string,
	): Promise<Lesson | null> {
		const slot = await this.prisma.lessonSlot.findUnique({
			where: {
				courtId_dayOfWeek_startTime: {
					courtId,
					dayOfWeek,
					startTime,
				},
			},
		});

		if (!slot) {
			return null;
		}

		return Lesson.create({
			id: slot.id,
			courtId: slot.courtId,
			coachId: slot.coachId,
			capacity: slot.capacity,
			dayOfWeek: slot.dayOfWeek,
			startTime: slot.startTime,
			endTime: slot.endTime,
			duration: slot.duration,
			createdAt: slot.createdAt,
		});
	}

	async create(lesson: Lesson): Promise<Lesson> {
		const created = await this.prisma.lessonSlot.create({
			data: {
				id: lesson.id,
				courtId: lesson.courtId,
				coachId: lesson.coachId,
				capacity: lesson.capacity,
				dayOfWeek: lesson.dayOfWeek,
				startTime: lesson.startTime,
				endTime: lesson.endTime,
				duration: lesson.duration,
			},
		});

		return Lesson.create({
			id: created.id,
			courtId: created.courtId,
			coachId: created.coachId,
			capacity: created.capacity,
			dayOfWeek: created.dayOfWeek,
			startTime: created.startTime,
			endTime: created.endTime,
			duration: created.duration,
			createdAt: created.createdAt,
		});
	}

	async update(lesson: Lesson): Promise<Lesson> {
		const updated = await this.prisma.lessonSlot.update({
			where: { id: lesson.id },
			data: {
				courtId: lesson.courtId,
				coachId: lesson.coachId,
				capacity: lesson.capacity,
				dayOfWeek: lesson.dayOfWeek,
				startTime: lesson.startTime,
				endTime: lesson.endTime,
				duration: lesson.duration,
			},
		});

		return Lesson.create({
			id: updated.id,
			courtId: updated.courtId,
			coachId: updated.coachId,
			capacity: updated.capacity,
			dayOfWeek: updated.dayOfWeek,
			startTime: updated.startTime,
			endTime: updated.endTime,
			duration: updated.duration,
			createdAt: updated.createdAt,
		});
	}

	async delete(id: string): Promise<void> {
		await this.prisma.lessonSlot.delete({
			where: { id },
		});
	}

	async findByCourtAndDay(
		courtId: string,
		dayOfWeek: string,
	): Promise<Lesson[]> {
		const lessonSlots = await this.prisma.lessonSlot.findMany({
			where: {
				courtId,
				dayOfWeek,
			},
			orderBy: { startTime: "asc" },
		});

		return lessonSlots.map((slot) =>
			Lesson.create({
				id: slot.id,
				courtId: slot.courtId,
				coachId: slot.coachId,
				capacity: slot.capacity,
				dayOfWeek: slot.dayOfWeek,
				startTime: slot.startTime,
				endTime: slot.endTime,
				duration: slot.duration,
				createdAt: slot.createdAt,
			}),
		);
	}
}

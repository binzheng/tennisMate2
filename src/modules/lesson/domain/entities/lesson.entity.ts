/**
 * Lesson Entity
 * レッスンスロットのドメインエンティティ
 */
export class Lesson {
	private constructor(
		public readonly id: string,
		public readonly courtId: string,
		public readonly coachId: string | null,
		public readonly capacity: number,
		public readonly dayOfWeek: string,
		public readonly startTime: string,
		public readonly endTime: string,
		public readonly duration: string,
		public readonly createdAt: Date,
	) {}

	/**
	 * Create a new Lesson entity
	 */
	static create(params: {
		id: string;
		courtId: string;
		coachId: string | null;
		capacity: number;
		dayOfWeek: string;
		startTime: string;
		endTime: string;
		duration: string;
		createdAt?: Date;
	}): Lesson {
		// Business validation
		if (params.capacity < 1) {
			throw new Error("定員は1以上である必要があります");
		}

		if (params.startTime >= params.endTime) {
			throw new Error("開始時刻は終了時刻より前である必要があります");
		}

		return new Lesson(
			params.id,
			params.courtId,
			params.coachId,
			params.capacity,
			params.dayOfWeek,
			params.startTime,
			params.endTime,
			params.duration,
			params.createdAt ?? new Date(),
		);
	}

	/**
	 * Check if lesson can be booked
	 */
	canBeBooked(currentReservations: number): boolean {
		return currentReservations < this.capacity;
	}

	/**
	 * Convert to public data (DTO)
	 */
	toPublicData() {
		return {
			id: this.id,
			courtId: this.courtId,
			coachId: this.coachId,
			capacity: this.capacity,
			dayOfWeek: this.dayOfWeek,
			startTime: this.startTime,
			endTime: this.endTime,
			duration: this.duration,
			createdAt: this.createdAt,
		};
	}
}

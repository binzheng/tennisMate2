/**
 * Lesson Data Transfer Objects
 */

export interface LessonDto {
	id: string;
	courtId: string;
	courtName?: string;
	coachId: string | null;
	coachName?: string | null;
	capacity: number;
	dayOfWeek: string;
	startTime: string;
	endTime: string;
	duration: string;
	createdAt: Date;
	reservationCount?: number;
}

export interface CreateLessonDto {
	courtId: string;
	coachId: string | null;
	capacity: number;
	dayOfWeek: string;
	startTime: string;
	duration: string;
}

export interface UpdateLessonDto {
	id: string;
	courtId?: string;
	coachId?: string | null;
	capacity?: number;
	dayOfWeek?: string;
	startTime?: string;
	duration?: string;
}

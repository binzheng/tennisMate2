import { z } from "zod";

/**
 * Lesson Validation Schemas
 * サーバーとクライアントで共有するバリデーションスキーマ
 */

// 曜日の定義
export const dayOfWeekSchema = z.enum([
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
]);

// 時間枠の定義（分単位）
export const durationSchema = z.enum(["60", "90", "120"]);

// 開始時刻（HH:mm形式）
export const startTimeSchema = z
	.string()
	.regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "HH:mm形式で入力してください");

// Server-side schemas (for API input)
export const createLessonSchema = z.object({
	courtId: z.string().min(1, "コートを選択してください"),
	coachId: z.string().nullable(),
	capacity: z.number().int().min(1, "定員は1以上である必要があります"),
	dayOfWeek: dayOfWeekSchema,
	startTime: startTimeSchema,
	duration: durationSchema,
});

export const updateLessonSchema = z.object({
	id: z.string(),
	courtId: z.string().min(1, "コートを選択してください").optional(),
	coachId: z.string().nullable().optional(),
	capacity: z
		.number()
		.int()
		.min(1, "定員は1以上である必要があります")
		.optional(),
	dayOfWeek: dayOfWeekSchema.optional(),
	startTime: startTimeSchema.optional(),
	duration: durationSchema.optional(),
});

export const deleteLessonSchema = z.object({
	id: z.string(),
});

// Client-side form schemas
export const lessonFormSchema = createLessonSchema;
export const lessonFormUpdateSchema = updateLessonSchema.omit({ id: true });

// Type exports
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type DeleteLessonInput = z.infer<typeof deleteLessonSchema>;
export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;
export type Duration = z.infer<typeof durationSchema>;

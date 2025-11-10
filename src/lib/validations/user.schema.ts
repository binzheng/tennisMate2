import { z } from "zod";

// ユーザーロール
export const userRoleSchema = z.enum(["player", "coach", "operator", "admin"]);

// ユーザー作成スキーマ
export const createUserSchema = z.object({
	userId: z
		.string()
		.min(3, "ユーザーIDは3文字以上で入力してください")
		.max(50, "ユーザーIDは50文字以内で入力してください"),
	name: z
		.string()
		.min(1, "名前は必須です")
		.max(100, "名前は100文字以内で入力してください"),
	email: z
		.string()
		.email("有効なメールアドレスを入力してください")
		.optional()
		.or(z.literal("")),
	password: z.string().min(8, "パスワードは8文字以上で入力してください"),
	role: userRoleSchema,
});

// ユーザー更新スキーマ（パスワードは任意）
export const updateUserSchema = z.object({
	id: z.string(),
	userId: z
		.string()
		.min(3, "ユーザーIDは3文字以上で入力してください")
		.max(50, "ユーザーIDは50文字以内で入力してください")
		.optional(),
	name: z
		.string()
		.min(1, "名前は必須です")
		.max(100, "名前は100文字以内で入力してください")
		.optional(),
	email: z
		.string()
		.email("有効なメールアドレスを入力してください")
		.optional()
		.or(z.literal("")),
	password: z
		.string()
		.refine(
			(val) => val === "" || val.length >= 8,
			"パスワードは8文字以上で入力してください",
		)
		.optional(),
	role: userRoleSchema.optional(),
});

// クライアント用のフォームスキーマ（IDなし）
export const userFormSchema = createUserSchema.omit({ password: true }).extend({
	password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

export const userFormUpdateSchema = updateUserSchema
	.omit({ id: true, password: true })
	.extend({
		password: z
			.string()
			.refine(
				(val) => val === "" || val.length >= 8,
				"パスワードは8文字以上で入力してください",
			),
	});

// 型エクスポート
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;

"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

interface UserFormProps {
	userId: string | null;
	onClose: () => void;
}

export function UserForm({ userId, onClose }: UserFormProps) {
	const [formData, setFormData] = useState({
		userId: "",
		name: "",
		email: "",
		password: "",
		role: "player" as "player" | "coach" | "operator" | "admin",
	});

	const utils = api.useUtils();
	const isEditing = userId !== null;

	// 編集時にデータを取得
	const { data: existingUser } = api.user.getById.useQuery(
		{ id: userId ?? "" },
		{ enabled: isEditing },
	);

	const createMutation = api.user.create.useMutation({
		onSuccess: () => {
			void utils.user.getAll.invalidate();
			onClose();
		},
		onError: (error) => {
			alert(error.message);
		},
	});

	const updateMutation = api.user.update.useMutation({
		onSuccess: () => {
			void utils.user.getAll.invalidate();
			onClose();
		},
		onError: (error) => {
			alert(error.message);
		},
	});

	useEffect(() => {
		if (existingUser) {
			setFormData({
				userId: existingUser.userId ?? "",
				name: existingUser.name ?? "",
				email: existingUser.email ?? "",
				password: "",
				role: existingUser.role,
			});
		}
	}, [existingUser]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (isEditing) {
			const updateData: {
				id: string;
				userId?: string;
				name?: string;
				email?: string;
				password?: string;
				role?: "player" | "coach" | "operator" | "admin";
			} = { id: userId };

			if (formData.userId) updateData.userId = formData.userId;
			if (formData.name) updateData.name = formData.name;
			if (formData.email) updateData.email = formData.email;
			if (formData.password) updateData.password = formData.password;
			if (formData.role) updateData.role = formData.role;

			updateMutation.mutate(updateData);
		} else {
			createMutation.mutate(formData);
		}
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	};

	const isLoading = createMutation.isPending || updateMutation.isPending;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
			<div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
				<h2 className="mb-4 font-bold text-2xl">
					{isEditing ? "ユーザー編集" : "ユーザー新規作成"}
				</h2>

				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label
							className="mb-2 block font-medium text-gray-700 text-sm"
							htmlFor="userId"
						>
							ユーザーID <span className="text-red-500">*</span>
						</label>
						<input
							className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
							id="userId"
							minLength={3}
							name="userId"
							onChange={handleChange}
							required
							type="text"
							value={formData.userId}
						/>
					</div>

					<div className="mb-4">
						<label
							className="mb-2 block font-medium text-gray-700 text-sm"
							htmlFor="name"
						>
							名前 <span className="text-red-500">*</span>
						</label>
						<input
							className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
							id="name"
							name="name"
							onChange={handleChange}
							required
							type="text"
							value={formData.name}
						/>
					</div>

					<div className="mb-4">
						<label
							className="mb-2 block font-medium text-gray-700 text-sm"
							htmlFor="email"
						>
							メールアドレス
						</label>
						<input
							className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
							id="email"
							name="email"
							onChange={handleChange}
							type="email"
							value={formData.email}
						/>
					</div>

					<div className="mb-4">
						<label
							className="mb-2 block font-medium text-gray-700 text-sm"
							htmlFor="password"
						>
							パスワード {!isEditing && <span className="text-red-500">*</span>}
							{isEditing && (
								<span className="text-gray-500 text-sm">
									（変更する場合のみ入力）
								</span>
							)}
						</label>
						<input
							className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
							id="password"
							minLength={8}
							name="password"
							onChange={handleChange}
							required={!isEditing}
							type="password"
							value={formData.password}
						/>
					</div>

					<div className="mb-6">
						<label
							className="mb-2 block font-medium text-gray-700 text-sm"
							htmlFor="role"
						>
							ロール <span className="text-red-500">*</span>
						</label>
						<select
							className="w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
							id="role"
							name="role"
							onChange={handleChange}
							required
							value={formData.role}
						>
							<option value="player">プレイヤー</option>
							<option value="coach">コーチ</option>
							<option value="operator">オペレーター</option>
							<option value="admin">管理者</option>
						</select>
					</div>

					<div className="flex justify-end gap-3">
						<button
							className="rounded bg-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-400 disabled:opacity-50"
							disabled={isLoading}
							onClick={onClose}
							type="button"
						>
							キャンセル
						</button>
						<button
							className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
							disabled={isLoading}
							type="submit"
						>
							{isLoading ? "処理中..." : isEditing ? "更新" : "作成"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

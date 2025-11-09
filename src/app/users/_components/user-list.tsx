"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface User {
	id: string;
	userId: string | null;
	name: string | null;
	email: string | null;
	role: "player" | "coach" | "operator" | "admin";
}

interface UserListProps {
	users: User[];
	onEdit: (userId: string) => void;
}

export function UserList({ users, onEdit }: UserListProps) {
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const utils = api.useUtils();
	const deleteMutation = api.user.delete.useMutation({
		onSuccess: () => {
			void utils.user.getAll.invalidate();
			setDeletingId(null);
		},
		onError: (error) => {
			alert(error.message);
			setDeletingId(null);
		},
	});

	const handleDelete = (id: string) => {
		if (confirm("このユーザーを削除してもよろしいですか？")) {
			setDeletingId(id);
			deleteMutation.mutate({ id });
		}
	};

	const getRoleLabel = (role: string) => {
		const labels: Record<string, string> = {
			player: "プレイヤー",
			coach: "コーチ",
			operator: "オペレーター",
			admin: "管理者",
		};
		return labels[role] ?? role;
	};

	if (users.length === 0) {
		return (
			<div className="text-center text-gray-500">
				ユーザーが登録されていません
			</div>
		);
	}

	return (
		<div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow">
			<table className="w-full">
				<thead className="bg-gray-50">
					<tr>
						<th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
							ユーザーID
						</th>
						<th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
							名前
						</th>
						<th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
							メールアドレス
						</th>
						<th className="px-6 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wider">
							ロール
						</th>
						<th className="px-6 py-3 text-right font-medium text-gray-500 text-xs uppercase tracking-wider">
							操作
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-gray-200 bg-white">
					{users.map((user) => (
						<tr className="hover:bg-gray-50" key={user.id}>
							<td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm">
								{user.userId ?? "-"}
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-gray-900 text-sm">
								{user.name ?? "-"}
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
								{user.email ?? "-"}
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-gray-500 text-sm">
								<span
									className={`inline-flex rounded-full px-2 font-semibold text-xs leading-5 ${
										user.role === "admin"
											? "bg-red-100 text-red-800"
											: user.role === "operator"
												? "bg-yellow-100 text-yellow-800"
												: user.role === "coach"
													? "bg-blue-100 text-blue-800"
													: "bg-green-100 text-green-800"
									}`}
								>
									{getRoleLabel(user.role)}
								</span>
							</td>
							<td className="whitespace-nowrap px-6 py-4 text-right font-medium text-sm">
								<button
									className="mr-3 text-blue-600 hover:text-blue-900"
									onClick={() => onEdit(user.id)}
									type="button"
								>
									編集
								</button>
								<button
									className="text-red-600 hover:text-red-900 disabled:opacity-50"
									disabled={deletingId === user.id}
									onClick={() => handleDelete(user.id)}
									type="button"
								>
									{deletingId === user.id ? "削除中..." : "削除"}
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

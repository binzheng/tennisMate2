"use client";

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

interface UserDialogProps {
	open: boolean;
	userId: string | null;
	onClose: () => void;
}

export function UserDialog({ open, userId, onClose }: UserDialogProps) {
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
			resetForm();
		},
		onError: (error) => {
			alert(error.message);
		},
	});

	const updateMutation = api.user.update.useMutation({
		onSuccess: () => {
			void utils.user.getAll.invalidate();
			onClose();
			resetForm();
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

	const resetForm = () => {
		setFormData({
			userId: "",
			name: "",
			email: "",
			password: "",
			role: "player",
		});
	};

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

	const handleClose = () => {
		onClose();
		resetForm();
	};

	const isLoading = createMutation.isPending || updateMutation.isPending;

	return (
		<Dialog fullWidth maxWidth="sm" onClose={handleClose} open={open}>
			<form onSubmit={handleSubmit}>
				<DialogTitle>
					{isEditing ? "ユーザー編集" : "ユーザー新規作成"}
				</DialogTitle>
				<DialogContent>
					<TextField
						fullWidth
						inputProps={{ minLength: 3 }}
						label="ユーザーID"
						margin="normal"
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, userId: e.target.value }))
						}
						required
						value={formData.userId}
					/>
					<TextField
						fullWidth
						label="名前"
						margin="normal"
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, name: e.target.value }))
						}
						required
						value={formData.name}
					/>
					<TextField
						fullWidth
						label="メールアドレス"
						margin="normal"
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, email: e.target.value }))
						}
						type="email"
						value={formData.email}
					/>
					<TextField
						fullWidth
						inputProps={{ minLength: 8 }}
						label={
							isEditing ? "パスワード（変更する場合のみ入力）" : "パスワード"
						}
						margin="normal"
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, password: e.target.value }))
						}
						required={!isEditing}
						type="password"
						value={formData.password}
					/>
					<FormControl fullWidth margin="normal" required>
						<InputLabel>ロール</InputLabel>
						<Select
							label="ロール"
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									role: e.target.value as typeof formData.role,
								}))
							}
							value={formData.role}
						>
							<MenuItem value="player">プレイヤー</MenuItem>
							<MenuItem value="coach">コーチ</MenuItem>
							<MenuItem value="operator">オペレーター</MenuItem>
							<MenuItem value="admin">管理者</MenuItem>
						</Select>
					</FormControl>
				</DialogContent>
				<DialogActions>
					<Button disabled={isLoading} onClick={handleClose}>
						キャンセル
					</Button>
					<Button disabled={isLoading} type="submit" variant="contained">
						{isLoading ? "処理中..." : isEditing ? "更新" : "作成"}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}

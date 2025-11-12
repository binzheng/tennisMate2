"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Backdrop,
	Button,
	CircularProgress,
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
import { Controller, useForm } from "react-hook-form";
import {
	userFormSchema,
	userFormUpdateSchema,
} from "~/lib/validations/user.schema";
import { api } from "~/trpc/react";

// Form data type - 新規作成と編集で共通の型
type UserFormData = {
	userId: string;
	name: string;
	email: string;
	password: string;
	role: "player" | "coach" | "operator" | "admin";
};

interface UserDialogProps {
	open: boolean;
	userId: string | null;
	onClose: () => void;
}

export function UserDialog({ open, userId, onClose }: UserDialogProps) {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const utils = api.useUtils();
	const isEditing = userId !== null;

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<UserFormData>({
		// 編集時と新規作成時で異なるスキーマを使用
		resolver: zodResolver(isEditing ? userFormUpdateSchema : userFormSchema),
		mode: "onChange",
		defaultValues: {
			userId: "",
			name: "",
			email: "",
			password: "",
			role: "player",
		},
	});

	// 編集時にデータを取得
	const { data: existingUser } = api.user.getById.useQuery(
		{ id: userId ?? "" },
		{ enabled: isEditing },
	);

	const createMutation = api.user.create.useMutation({
		onSuccess: () => {
			void utils.user.getAll.invalidate();
			onClose();
			reset();
		},
		onError: (error) => {
			setErrorMessage(error.message);
		},
	});

	const updateMutation = api.user.update.useMutation({
		onSuccess: () => {
			void utils.user.getAll.invalidate();
			onClose();
			reset();
		},
		onError: (error) => {
			setErrorMessage(error.message);
		},
	});

	useEffect(() => {
		if (existingUser) {
			reset({
				userId: existingUser.userId ?? "",
				name: existingUser.name ?? "",
				email: existingUser.email ?? "",
				password: "",
				role: existingUser.role,
			});
		}
	}, [existingUser, reset]);

	const onSubmit = (data: UserFormData) => {
		if (isEditing) {
			const updateData: {
				id: string;
				userId?: string;
				name?: string;
				email?: string;
				password?: string;
				role?: "player" | "coach" | "operator" | "admin";
			} = { id: userId };

			if (data.userId) updateData.userId = data.userId;
			if (data.name) updateData.name = data.name;
			if (data.email) updateData.email = data.email;
			if (data.password) updateData.password = data.password;
			if (data.role) updateData.role = data.role;

			updateMutation.mutate(updateData);
		} else {
			createMutation.mutate(data);
		}
	};

	const handleClose = () => {
		onClose();
		reset();
	};

	const isLoading = createMutation.isPending || updateMutation.isPending;

	return (
		<>
			<Dialog fullWidth maxWidth="sm" onClose={handleClose} open={open}>
				<form onSubmit={handleSubmit(onSubmit)}>
					<DialogTitle>
						{isEditing ? "ユーザー編集" : "ユーザー新規作成"}
					</DialogTitle>
					<DialogContent sx={{ position: "relative" }}>
						<Controller
							control={control}
							name="userId"
							render={({ field }) => (
								<TextField
									{...field}
									error={!!errors.userId}
									fullWidth
									helperText={errors.userId?.message}
									label="ユーザーID"
									margin="normal"
								/>
							)}
						/>
						<Controller
							control={control}
							name="name"
							render={({ field }) => (
								<TextField
									{...field}
									error={!!errors.name}
									fullWidth
									helperText={errors.name?.message}
									label="名前"
									margin="normal"
								/>
							)}
						/>
						<Controller
							control={control}
							name="email"
							render={({ field }) => (
								<TextField
									{...field}
									error={!!errors.email}
									fullWidth
									helperText={errors.email?.message}
									label="メールアドレス"
									margin="normal"
									type="email"
								/>
							)}
						/>
						<Controller
							control={control}
							name="password"
							render={({ field }) => (
								<TextField
									{...field}
									error={!!errors.password}
									fullWidth
									helperText={errors.password?.message}
									label={
										isEditing
											? "パスワード（変更する場合のみ入力）"
											: "パスワード"
									}
									margin="normal"
									type="password"
								/>
							)}
						/>
						<Controller
							control={control}
							name="role"
							render={({ field }) => (
								<FormControl fullWidth margin="normal">
									<InputLabel>ロール</InputLabel>
									<Select {...field} label="ロール">
										<MenuItem value="player">プレイヤー</MenuItem>
										<MenuItem value="coach">コーチ</MenuItem>
										<MenuItem value="operator">オペレーター</MenuItem>
										<MenuItem value="admin">管理者</MenuItem>
									</Select>
								</FormControl>
							)}
						/>

						{/* ローディング中のBackdrop */}
						<Backdrop
							open={isLoading}
							sx={{
								position: "absolute",
								zIndex: (theme) => theme.zIndex.drawer + 1,
								color: "#fff",
								backgroundColor: "rgba(0, 0, 0, 0.5)",
							}}
						>
							<CircularProgress color="inherit" />
						</Backdrop>
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

			<Dialog
				fullWidth
				maxWidth="sm"
				onClose={() => setErrorMessage(null)}
				open={errorMessage !== null}
			>
				<DialogTitle>エラー</DialogTitle>
				<DialogContent>{errorMessage}</DialogContent>
				<DialogActions>
					<Button onClick={() => setErrorMessage(null)} variant="contained">
						閉じる
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

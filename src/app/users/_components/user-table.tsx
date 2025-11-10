"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	IconButton,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from "@mui/material";
import { useState } from "react";
import { api } from "~/trpc/react";

interface User {
	id: string;
	userId: string | null;
	name: string | null;
	email: string | null;
	role: "player" | "coach" | "operator" | "admin";
}

interface UserTableProps {
	users: User[];
	onEdit: (userId: string) => void;
}

const roleConfig = {
	admin: { label: "管理者", color: "error" as const },
	operator: { label: "オペレーター", color: "warning" as const },
	coach: { label: "コーチ", color: "info" as const },
	player: { label: "プレイヤー", color: "success" as const },
};

export function UserTable({ users, onEdit }: UserTableProps) {
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const utils = api.useUtils();
	const deleteMutation = api.user.delete.useMutation({
		onSuccess: () => {
			void utils.user.getAll.invalidate();
			setDeleteConfirmOpen(false);
			setDeleteTargetId(null);
		},
		onError: (error) => {
			setErrorMessage(error.message);
			setDeleteConfirmOpen(false);
			setDeleteTargetId(null);
		},
	});

	const handleDelete = (id: string) => {
		setDeleteTargetId(id);
		setDeleteConfirmOpen(true);
	};

	const handleDeleteConfirm = () => {
		if (deleteTargetId) {
			deleteMutation.mutate({ id: deleteTargetId });
		}
	};

	const handleDeleteCancel = () => {
		setDeleteConfirmOpen(false);
		setDeleteTargetId(null);
	};

	if (users.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
				ユーザーが登録されていません
			</Paper>
		);
	}

	return (
		<>
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>ユーザーID</TableCell>
							<TableCell>名前</TableCell>
							<TableCell>メールアドレス</TableCell>
							<TableCell>ロール</TableCell>
							<TableCell align="right">操作</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{users.map((user) => (
							<TableRow hover key={user.id}>
								<TableCell>{user.userId ?? "-"}</TableCell>
								<TableCell>{user.name ?? "-"}</TableCell>
								<TableCell>{user.email ?? "-"}</TableCell>
								<TableCell>
									<Chip
										color={roleConfig[user.role].color}
										label={roleConfig[user.role].label}
										size="small"
									/>
								</TableCell>
								<TableCell align="right">
									<IconButton
										aria-label="編集"
										color="primary"
										onClick={() => onEdit(user.id)}
										size="small"
									>
										<EditIcon />
									</IconButton>
									<IconButton
										aria-label="削除"
										color="error"
										disabled={deleteMutation.isPending}
										onClick={() => handleDelete(user.id)}
										size="small"
									>
										<DeleteIcon />
									</IconButton>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			{/* 削除確認ダイアログ */}
			<Dialog
				fullWidth
				maxWidth="sm"
				onClose={handleDeleteCancel}
				open={deleteConfirmOpen}
			>
				<DialogTitle>確認</DialogTitle>
				<DialogContent>
					<DialogContentText>
						このユーザーを削除してもよろしいですか？
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleDeleteCancel}>キャンセル</Button>
					<Button
						color="error"
						disabled={deleteMutation.isPending}
						onClick={handleDeleteConfirm}
						variant="contained"
					>
						{deleteMutation.isPending ? "削除中..." : "削除"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* エラーダイアログ */}
			<Dialog
				fullWidth
				maxWidth="sm"
				onClose={() => setErrorMessage(null)}
				open={errorMessage !== null}
			>
				<DialogTitle>エラー</DialogTitle>
				<DialogContent>
					<DialogContentText>{errorMessage}</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setErrorMessage(null)} variant="contained">
						閉じる
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

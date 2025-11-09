"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
	Chip,
	IconButton,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from "@mui/material";
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
	const utils = api.useUtils();
	const deleteMutation = api.user.delete.useMutation({
		onSuccess: () => {
			void utils.user.getAll.invalidate();
		},
		onError: (error) => {
			alert(error.message);
		},
	});

	const handleDelete = (id: string) => {
		if (confirm("このユーザーを削除してもよろしいですか？")) {
			deleteMutation.mutate({ id });
		}
	};

	if (users.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
				ユーザーが登録されていません
			</Paper>
		);
	}

	return (
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
									color="primary"
									onClick={() => onEdit(user.id)}
									size="small"
								>
									<EditIcon />
								</IconButton>
								<IconButton
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
	);
}

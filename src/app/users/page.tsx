"use client";

import { Add as AddIcon } from "@mui/icons-material";
import {
	Box,
	Button,
	CircularProgress,
	Container,
	Typography,
} from "@mui/material";
import { useState } from "react";
import { api } from "~/trpc/react";
import { UserDialog } from "./_components/user-dialog";
import { UserTable } from "./_components/user-table";

export default function UsersPage() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingUserId, setEditingUserId] = useState<string | null>(null);

	const { data: users, isLoading } = api.user.getAll.useQuery();

	const handleCreate = () => {
		setEditingUserId(null);
		setIsDialogOpen(true);
	};

	const handleEdit = (userId: string) => {
		setEditingUserId(userId);
		setIsDialogOpen(true);
	};

	const handleClose = () => {
		setIsDialogOpen(false);
		setEditingUserId(null);
	};

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 4,
				}}
			>
				<Typography component="h1" variant="h4">
					ユーザーマスタ
				</Typography>
				<Button
					onClick={handleCreate}
					startIcon={<AddIcon />}
					variant="contained"
				>
					新規作成
				</Button>
			</Box>

			{isLoading ? (
				<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
					<CircularProgress />
				</Box>
			) : (
				<UserTable onEdit={handleEdit} users={users ?? []} />
			)}

			<UserDialog
				onClose={handleClose}
				open={isDialogOpen}
				userId={editingUserId}
			/>
		</Container>
	);
}

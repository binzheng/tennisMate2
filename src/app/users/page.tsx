"use client";

import { Add as AddIcon } from "@mui/icons-material";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
	Box,
	CircularProgress,
	IconButton,
	Paper,
	Typography,
} from "@mui/material";
import { useState } from "react";
import { MainLayout } from "~/components/layout/main-layout";
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
		<MainLayout>
			<Box
				sx={{
					maxWidth: { xs: "100%", lg: 1200 },
					mx: "auto",
				}}
			>
				<Paper
					elevation={0}
					sx={{
						bgcolor: "background.paper",
						borderRadius: 2,
						overflow: "hidden",
					}}
				>
					{/* ヘッダー */}
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							p: { xs: 2, sm: 3 },
							borderBottom: 1,
							borderColor: "divider",
							flexWrap: { xs: "wrap", sm: "nowrap" },
							gap: 2,
						}}
					>
						<Typography
							component="h1"
							sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}
							variant="h5"
						>
							ユーザーマスタ
						</Typography>
						<Box sx={{ display: "flex", gap: 1 }}>
							<IconButton
								color="primary"
								onClick={handleCreate}
								size="small"
								title="新規作成"
							>
								<AddIcon />
							</IconButton>
							<IconButton
								color="primary"
								size="small"
								sx={{ display: { xs: "none", sm: "inline-flex" } }}
								title="フィルター"
							>
								<FilterListIcon />
							</IconButton>
							<IconButton
								color="primary"
								size="small"
								sx={{ display: { xs: "none", sm: "inline-flex" } }}
								title="エクスポート"
							>
								<DownloadIcon />
							</IconButton>
						</Box>
					</Box>

					{/* コンテンツ */}
					{isLoading ? (
						<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
							<CircularProgress />
						</Box>
					) : (
						<UserTable onEdit={handleEdit} users={users ?? []} />
					)}
				</Paper>
			</Box>

			<UserDialog
				onClose={handleClose}
				open={isDialogOpen}
				userId={editingUserId}
			/>
		</MainLayout>
	);
}

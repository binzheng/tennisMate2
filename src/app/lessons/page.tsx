"use client";

import { Add as AddIcon } from "@mui/icons-material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DownloadIcon from "@mui/icons-material/Download";
import FilterListIcon from "@mui/icons-material/FilterList";
import TableRowsIcon from "@mui/icons-material/TableRows";
import {
	Box,
	CircularProgress,
	IconButton,
	Paper,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material";
import { useState } from "react";
import { MainLayout } from "~/components/layout/main-layout";
import { api } from "~/trpc/react";
import { LessonCalendar } from "./_components/lesson-calendar";
import { LessonDialog } from "./_components/lesson-dialog";
import { LessonTable } from "./_components/lesson-table";

export default function LessonsPage() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
	const [viewMode, setViewMode] = useState<"table" | "calendar">("table");

	const { data: lessons, isLoading } = api.lesson.getAll.useQuery();

	const handleCreate = () => {
		setEditingLessonId(null);
		setIsDialogOpen(true);
	};

	const handleEdit = (lessonId: string) => {
		setEditingLessonId(lessonId);
		setIsDialogOpen(true);
	};

	const handleClose = () => {
		setIsDialogOpen(false);
		setEditingLessonId(null);
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
							レッスンマスタ
						</Typography>
						<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
							<ToggleButtonGroup
								exclusive
								onChange={(_, newMode) => {
									if (newMode !== null) {
										setViewMode(newMode);
									}
								}}
								size="small"
								value={viewMode}
							>
								<ToggleButton value="table">
									<TableRowsIcon fontSize="small" />
								</ToggleButton>
								<ToggleButton value="calendar">
									<CalendarMonthIcon fontSize="small" />
								</ToggleButton>
							</ToggleButtonGroup>
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
					) : viewMode === "table" ? (
						<LessonTable lessons={lessons ?? []} onEdit={handleEdit} />
					) : (
						<Box sx={{ p: 3 }}>
							<LessonCalendar
								lessons={lessons ?? []}
								onEventClick={handleEdit}
							/>
						</Box>
					)}
				</Paper>
			</Box>

			<LessonDialog
				lessonId={editingLessonId}
				onClose={handleClose}
				open={isDialogOpen}
			/>
		</MainLayout>
	);
}

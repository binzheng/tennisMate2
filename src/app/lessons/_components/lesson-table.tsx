"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
	Box,
	Button,
	Checkbox,
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
	TablePagination,
	TableRow,
} from "@mui/material";
import { useState } from "react";
import { api } from "~/trpc/react";

interface Lesson {
	id: string;
	courtId: string;
	courtName?: string;
	coachId: string | null;
	capacity: number;
	dayOfWeek: string;
	startTime: string;
	duration: string;
}

interface LessonTableProps {
	lessons: Lesson[];
	onEdit: (lessonId: string) => void;
}

// 曜日の表示名
const dayOfWeekLabels: Record<string, string> = {
	monday: "月曜日",
	tuesday: "火曜日",
	wednesday: "水曜日",
	thursday: "木曜日",
	friday: "金曜日",
	saturday: "土曜日",
	sunday: "日曜日",
};

// 時間枠の表示名
const durationLabels: Record<string, string> = {
	"60": "1時間",
	"90": "1時間半",
	"120": "2時間",
};

export function LessonTable({ lessons, onEdit }: LessonTableProps) {
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [selected, setSelected] = useState<string[]>([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(20);

	const utils = api.useUtils();
	const deleteMutation = api.lesson.delete.useMutation({
		onSuccess: () => {
			void utils.lesson.getAll.invalidate();
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

	const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			const newSelected = lessons.map((lesson) => lesson.id);
			setSelected(newSelected);
			return;
		}
		setSelected([]);
	};

	const handleSelectClick = (id: string) => {
		const selectedIndex = selected.indexOf(id);
		let newSelected: string[] = [];

		if (selectedIndex === -1) {
			newSelected = newSelected.concat(selected, id);
		} else if (selectedIndex === 0) {
			newSelected = newSelected.concat(selected.slice(1));
		} else if (selectedIndex === selected.length - 1) {
			newSelected = newSelected.concat(selected.slice(0, -1));
		} else if (selectedIndex > 0) {
			newSelected = newSelected.concat(
				selected.slice(0, selectedIndex),
				selected.slice(selectedIndex + 1),
			);
		}

		setSelected(newSelected);
	};

	const handleChangePage = (_event: unknown, newPage: number) => {
		setPage(newPage);
	};

	const handleChangeRowsPerPage = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		setRowsPerPage(Number.parseInt(event.target.value, 10));
		setPage(0);
	};

	const isSelected = (id: string) => selected.indexOf(id) !== -1;

	const paginatedLessons = lessons.slice(
		page * rowsPerPage,
		page * rowsPerPage + rowsPerPage,
	);

	if (lessons.length === 0) {
		return (
			<Paper sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
				レッスンが登録されていません
			</Paper>
		);
	}

	return (
		<>
			<TableContainer
				component={Paper}
				elevation={0}
				sx={{ overflowX: "auto" }}
			>
				<Table sx={{ minWidth: { xs: 500, sm: 650 } }}>
					<TableHead>
						<TableRow>
							<TableCell padding="checkbox">
								<Checkbox
									checked={
										lessons.length > 0 && selected.length === lessons.length
									}
									color="primary"
									indeterminate={
										selected.length > 0 && selected.length < lessons.length
									}
									onChange={handleSelectAllClick}
								/>
							</TableCell>
							<TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
								No
							</TableCell>
							<TableCell>コート</TableCell>
							<TableCell>曜日</TableCell>
							<TableCell>開始時刻</TableCell>
							<TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
								時間枠
							</TableCell>
							<TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
								定員
							</TableCell>
							<TableCell align="right">操作</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{paginatedLessons.map((lesson, index) => {
							const isItemSelected = isSelected(lesson.id);
							return (
								<TableRow
									hover
									key={lesson.id}
									onClick={() => handleSelectClick(lesson.id)}
									role="checkbox"
									selected={isItemSelected}
									sx={{ cursor: "pointer" }}
								>
									<TableCell padding="checkbox">
										<Checkbox checked={isItemSelected} color="primary" />
									</TableCell>
									<TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
										{page * rowsPerPage + index + 1}
									</TableCell>
									<TableCell>{lesson.courtName ?? lesson.courtId}</TableCell>
									<TableCell>
										{dayOfWeekLabels[lesson.dayOfWeek] ?? lesson.dayOfWeek}
									</TableCell>
									<TableCell>{lesson.startTime}</TableCell>
									<TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
										{durationLabels[lesson.duration] ?? lesson.duration}
									</TableCell>
									<TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
										{lesson.capacity}
									</TableCell>
									<TableCell align="right" onClick={(e) => e.stopPropagation()}>
										<IconButton
											aria-label="編集"
											color="primary"
											onClick={() => onEdit(lesson.id)}
											size="small"
										>
											<EditIcon fontSize="small" />
										</IconButton>
										<IconButton
											aria-label="削除"
											color="error"
											disabled={deleteMutation.isPending}
											onClick={() => handleDelete(lesson.id)}
											size="small"
										>
											<DeleteIcon fontSize="small" />
										</IconButton>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>

			{/* ページネーション */}
			<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
				<TablePagination
					component="div"
					count={lessons.length}
					onPageChange={handleChangePage}
					onRowsPerPageChange={handleChangeRowsPerPage}
					page={page}
					rowsPerPage={rowsPerPage}
					rowsPerPageOptions={[20, 50, 100]}
				/>
			</Box>

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
						このレッスンを削除してもよろしいですか?
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

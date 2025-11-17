"use client";

import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
	Alert,
	Backdrop,
	Box,
	Button,
	Chip,
	CircularProgress,
	Container,
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
	Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MainLayout } from "~/components/layout/main-layout";
import { api } from "~/trpc/react";

export default function MatchListPage() {
	const router = useRouter();
	const utils = api.useUtils();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
		null,
	);
	const [selectedSessionName, setSelectedSessionName] = useState<string>("");

	const { data: sessions, isLoading, error } = api.match.getAll.useQuery();

	const deleteMutation = api.match.delete.useMutation({
		onSuccess: () => {
			void utils.match.getAll.invalidate();
			setDeleteDialogOpen(false);
			setSelectedSessionId(null);
		},
	});

	const handleDeleteClick = (
		e: React.MouseEvent,
		sessionId: string,
		sessionName: string,
	) => {
		e.stopPropagation();
		setSelectedSessionId(sessionId);
		setSelectedSessionName(sessionName);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = () => {
		if (selectedSessionId) {
			deleteMutation.mutate({ id: selectedSessionId });
		}
	};

	const handleDeleteCancel = () => {
		setDeleteDialogOpen(false);
		setSelectedSessionId(null);
		setSelectedSessionName("");
	};

	if (isLoading) {
		return (
			<MainLayout>
				<Backdrop open>
					<CircularProgress />
				</Backdrop>
			</MainLayout>
		);
	}

	if (error) {
		return (
			<MainLayout>
				<Container maxWidth="lg">
					<Alert severity="error">エラーが発生しました: {error.message}</Alert>
				</Container>
			</MainLayout>
		);
	}

	return (
		<MainLayout>
			<Container maxWidth="lg">
				<Box sx={{ mt: 4, mb: 4 }}>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							mb: 3,
						}}
					>
						<Typography component="h1" variant="h4">
							ゲームマッチング一覧
						</Typography>
						<Box sx={{ display: "flex", gap: 1 }}>
							<Button
								onClick={() => router.push("/match/new")}
								startIcon={<AddIcon />}
								variant="contained"
							>
								新規作成
							</Button>
						</Box>
					</Box>

					{!sessions || sessions.length === 0 ? (
						<Paper sx={{ p: 4, textAlign: "center" }}>
							<Typography color="text.secondary" variant="body1">
								マッチングセッションがまだありません。
							</Typography>
							<Button
								onClick={() => router.push("/match/new")}
								startIcon={<AddIcon />}
								sx={{ mt: 2 }}
								variant="contained"
							>
								最初のセッションを作成
							</Button>
						</Paper>
					) : (
						<TableContainer component={Paper}>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>セッション名</TableCell>
										<TableCell>日付</TableCell>
										<TableCell align="center">プレイヤー数</TableCell>
										<TableCell align="center">作成日</TableCell>
										<TableCell align="right">操作</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{sessions.map((session) => (
										<TableRow
											hover
											key={session.id}
											onClick={() => router.push(`/match/${session.id}`)}
											sx={{ cursor: "pointer" }}
										>
											<TableCell>
												<Typography variant="body1">{session.name}</Typography>
											</TableCell>
											<TableCell>
												{new Date(session.date).toLocaleDateString("ja-JP")}
											</TableCell>
											<TableCell align="center">
												<Chip label={`${session.playerCount}人`} size="small" />
											</TableCell>
											<TableCell align="center">
												{new Date(session.createdAt).toLocaleDateString(
													"ja-JP",
												)}
											</TableCell>
											<TableCell align="right">
												<Box
													sx={{
														display: "flex",
														gap: 1,
														justifyContent: "flex-end",
													}}
												>
													<Button
														onClick={(e) => {
															e.stopPropagation();
															router.push(`/match/${session.id}`);
														}}
														size="small"
														variant="outlined"
													>
														詳細
													</Button>
													<IconButton
														aria-label="削除"
														color="error"
														onClick={(e) =>
															handleDeleteClick(e, session.id, session.name)
														}
														size="small"
													>
														<DeleteIcon />
													</IconButton>
												</Box>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</Box>

				<Dialog onClose={handleDeleteCancel} open={deleteDialogOpen}>
					<DialogTitle>セッションの削除</DialogTitle>
					<DialogContent>
						<DialogContentText>
							セッション「{selectedSessionName}
							」を削除してもよろしいですか？
							<br />
							この操作は取り消せません。
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
			</Container>
		</MainLayout>
	);
}

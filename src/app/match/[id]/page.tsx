"use client";

import { PictureAsPdf as PdfIcon } from "@mui/icons-material";
import {
	Alert,
	Backdrop,
	Box,
	Button,
	Chip,
	CircularProgress,
	Container,
	FormControl,
	MenuItem,
	Paper as MuiPaper,
	Paper,
	Select,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { MainLayout } from "~/components/layout/main-layout";
import { api } from "~/trpc/react";

interface PageProps {
	params: Promise<{ id: string }>;
}

const SCORE_OPTIONS = [0, 15, 30, 45, 60, 75];

export default function MatchSessionPage({ params }: PageProps) {
	const resolvedParams = use(params);
	const router = useRouter();
	const utils = api.useUtils();
	const [teamScores, setTeamScores] = useState<
		Record<string, { team1: number; team2: number }>
	>({});
	const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

	const generateSessionPDFQuery = api.match.generateSessionPDF.useQuery(
		{
			id: resolvedParams.id,
		},
		{
			enabled: false,
			refetchOnWindowFocus: false,
			retry: false,
		},
	);

	const { data: session, isLoading } = api.match.getById.useQuery({
		id: resolvedParams.id,
	});

	const updateGameMutation = api.match.updateGameResult.useMutation({
		onSuccess: () => {
			void utils.match.getById.invalidate({ id: resolvedParams.id });
		},
	});

	const handleScoreChange = (
		gameId: string,
		team: "team1" | "team2",
		score: number,
	) => {
		setTeamScores((prev) => ({
			...prev,
			[gameId]: {
				...(prev[gameId] ?? { team1: 0, team2: 0 }),
				[team]: score,
			},
		}));
	};

	const handleDownloadPDF = async () => {
		setIsGeneratingPDF(true);
		try {
			const { data } = await generateSessionPDFQuery.refetch();

			if (data) {
				const { pdf } = data;

				// Convert base64 to blob
				const byteCharacters = atob(pdf);
				const byteNumbers = new Array(byteCharacters.length);
				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i);
				}
				const byteArray = new Uint8Array(byteNumbers);
				const blob = new Blob([byteArray], { type: "application/pdf" });

				// Open PDF in new tab
				const url = window.URL.createObjectURL(blob);
				window.open(url, "_blank");

				// Clean up the URL after a short delay to allow the browser to open it
				setTimeout(() => {
					window.URL.revokeObjectURL(url);
				}, 100);
			}
		} catch (err) {
			console.error("PDF generation failed:", err);
			alert("PDFの生成に失敗しました");
		} finally {
			setIsGeneratingPDF(false);
		}
	};

	const handleSubmitGameResult = (gameId: string) => {
		if (!session) return;

		const game = session.games.find((g) => g.id === gameId);
		if (!game) return;

		const scores = teamScores[gameId];
		if (!scores) return;

		const team1Score = scores.team1;
		const team2Score = scores.team2;

		// 勝者: 45は特別扱いしない。点数が多い方が勝ち
		const winner: 1 | 2 = team1Score >= team2Score ? 1 : 2;

		// Calculate individual player scores (distribute with remainder to keep total)
		const team1Players = game.players.filter((p) => p.team === 1);
		const team2Players = game.players.filter((p) => p.team === 2);

		const distribute = (total: number, count: number): number[] => {
			const base = Math.floor(total / count);
			let remainder = total - base * count;
			return Array.from({ length: count }, () => {
				const value = base + (remainder > 0 ? 1 : 0);
				if (remainder > 0) remainder--;
				return value;
			});
		};

		const team1Distribution = distribute(team1Score, team1Players.length);
		const team2Distribution = distribute(team2Score, team2Players.length);

		updateGameMutation.mutate({
			gameId,
			playerScores: [
				...team1Players.map((p, i) => ({
					playerId: p.id,
					score: team1Distribution[i] ?? 0,
				})),
				...team2Players.map((p, i) => ({
					playerId: p.id,
					score: team2Distribution[i] ?? 0,
				})),
			],
			winner,
		});
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

	if (!session) {
		return (
			<MainLayout>
				<Container maxWidth="lg">
					<Alert severity="error">セッションが見つかりません</Alert>
				</Container>
			</MainLayout>
		);
	}

	// プレイヤー別 勝利数（小計）を計算
	type PlayerKey = string;
	interface WinEntry {
		key: PlayerKey;
		name: string;
		wins: number;
	}
	const winMap = new Map<PlayerKey, WinEntry>();
	// まずユニークなプレイヤー集合を用意（実際に出場した人＝team>0）
	for (const g of session.games) {
		for (const p of g.players) {
			if (p.team > 0) {
				const key: PlayerKey = p.userId ?? `name:${p.playerName}`;
				if (!winMap.has(key)) {
					winMap.set(key, { key, name: p.playerName, wins: 0 });
				}
			}
		}
	}
	// 完了試合の勝者チームに属するプレイヤーへ+1
	for (const g of session.games) {
		if (g.status === "completed" && (g.winner === 1 || g.winner === 2)) {
			for (const p of g.players) {
				if (p.team === g.winner) {
					const key: PlayerKey = p.userId ?? `name:${p.playerName}`;
					const current = winMap.get(key);
					if (current) current.wins += 1;
				}
			}
		}
	}
	const winList = Array.from(winMap.values()).sort(
		(a, b) => b.wins - a.wins || a.name.localeCompare(b.name),
	);

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
							{session.name}
						</Typography>
						<Box sx={{ display: "flex", gap: 1 }}>
							<Button
								onClick={() => {
									// マッチング一覧のキャッシュを無効化して最新データを取得
									void utils.match.getAll.invalidate();
									router.push("/match");
								}}
								variant="outlined"
							>
								戻る
							</Button>
							<Button
								disabled={isGeneratingPDF}
								onClick={handleDownloadPDF}
								startIcon={<PdfIcon />}
								variant="contained"
							>
								{isGeneratingPDF ? "PDF生成中..." : "PDF出力"}
							</Button>{" "}
						</Box>
					</Box>

					<div id="print-area">
						<Paper sx={{ p: 3, mb: 3 }}>
							<Typography gutterBottom variant="h6">
								セッション情報
							</Typography>
							<Typography color="text.secondary" variant="body1">
								日付: {new Date(session.date).toLocaleDateString("ja-JP")}
							</Typography>
							<Typography color="text.secondary" variant="body1">
								プレイヤー数: {session.playerCount}人
							</Typography>
							<Typography color="text.secondary" variant="body1">
								ゲーム数: {session.games.length}試合
							</Typography>
						</Paper>

						{/* 勝利数小計 */}
						<MuiPaper sx={{ p: 2, mb: 3 }}>
							<Typography gutterBottom variant="h6">
								プレイヤー別 勝利数（小計）
							</Typography>
							{winList.length === 0 ? (
								<Typography color="text.secondary" variant="body2">
									まだ勝敗が記録された試合がありません。
								</Typography>
							) : (
								<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
									{winList.map((w) => (
										<Chip
											color={w.wins > 0 ? "primary" : "default"}
											key={w.key}
											label={`${w.name}: ${w.wins}勝`}
											variant={w.wins > 0 ? "filled" : "outlined"}
										/>
									))}
								</Box>
							)}
						</MuiPaper>

						<Typography gutterBottom variant="h5">
							ゲーム一覧
						</Typography>

						<TableContainer component={Paper}>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>ゲーム番号</TableCell>
										<TableCell>チーム1</TableCell>
										<TableCell>チーム2</TableCell>
										<TableCell>休み</TableCell>
										<TableCell align="center">スコア</TableCell>
										<TableCell align="center" className="print-hide">
											ステータス
										</TableCell>
										<TableCell align="right" className="print-hide">
											操作
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{session.games.map((game) => {
										const team1Players = game.players.filter(
											(p) => p.team === 1,
										);
										const team2Players = game.players.filter(
											(p) => p.team === 2,
										);
										const restingPlayers = game.players.filter(
											(p) => p.team === 0,
										);
										const team1Score = team1Players.reduce(
											(sum, p) => sum + (p.score ?? 0),
											0,
										);
										const team2Score = team2Players.reduce(
											(sum, p) => sum + (p.score ?? 0),
											0,
										);

										return (
											<TableRow key={game.id}>
												<TableCell>#{game.gameNumber}</TableCell>
												<TableCell>
													{team1Players.map((p) => p.playerName).join(", ")}
												</TableCell>
												<TableCell>
													{team2Players.map((p) => p.playerName).join(", ")}
												</TableCell>
												<TableCell>
													<Typography color="text.secondary" variant="body2">
														{restingPlayers.length > 0
															? restingPlayers
																	.map((p) => p.playerName)
																	.join(", ")
															: "-"}
													</Typography>
												</TableCell>
												<TableCell align="center">
													{game.status === "completed" ? (
														<Typography
															fontWeight="bold"
															sx={{
																color:
																	team1Score > team2Score
																		? "success.main"
																		: team1Score < team2Score
																			? "error.main"
																			: "text.primary",
															}}
														>
															{team1Score} - {team2Score}
														</Typography>
													) : (
														<Box
															sx={{
																display: "flex",
																gap: 1,
																alignItems: "center",
																justifyContent: "center",
															}}
														>
															<FormControl size="small" sx={{ minWidth: 70 }}>
																<Select
																	onChange={(e) =>
																		handleScoreChange(
																			game.id,
																			"team1",
																			e.target.value as number,
																		)
																	}
																	value={
																		teamScores[game.id]?.team1 ?? team1Score
																	}
																>
																	{SCORE_OPTIONS.map((score) => (
																		<MenuItem key={score} value={score}>
																			{score}
																		</MenuItem>
																	))}
																</Select>
															</FormControl>
															<Typography>-</Typography>
															<FormControl size="small" sx={{ minWidth: 70 }}>
																<Select
																	onChange={(e) =>
																		handleScoreChange(
																			game.id,
																			"team2",
																			e.target.value as number,
																		)
																	}
																	value={
																		teamScores[game.id]?.team2 ?? team2Score
																	}
																>
																	{SCORE_OPTIONS.map((score) => (
																		<MenuItem key={score} value={score}>
																			{score}
																		</MenuItem>
																	))}
																</Select>
															</FormControl>
														</Box>
													)}
												</TableCell>
												<TableCell align="center" className="print-hide">
													<Chip
														color={
															game.status === "completed"
																? "success"
																: "default"
														}
														label={
															game.status === "completed"
																? game.winner === 1
																	? "チーム1勝ち"
																	: "チーム2勝ち"
																: game.status === "in_progress"
																	? "進行中"
																	: "予定"
														}
														size="small"
													/>
												</TableCell>
												<TableCell align="right" className="print-hide">
													{game.status !== "completed" && (
														<Button
															className="no-print"
															disabled={updateGameMutation.isPending}
															onClick={() => handleSubmitGameResult(game.id)}
															size="small"
															variant="contained"
														>
															保存
														</Button>
													)}
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</TableContainer>
					</div>
				</Box>
			</Container>
		</MainLayout>
	);
}

"use client";

import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
	Alert,
	Autocomplete,
	Box,
	Button,
	Container,
	IconButton,
	List,
	ListItem,
	Paper,
	TextField,
	Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { MainLayout } from "~/components/layout/main-layout";
import { api } from "~/trpc/react";

export default function NewMatchPage() {
	const router = useRouter();
	const { data: session } = useSession();
	const [sessionName, setSessionName] = useState("");
	const [playerCount, setPlayerCount] = useState(4);
	const [players, setPlayers] = useState<
		{ id: string; name: string; userId: string | null }[]
	>([]);
	const [error, setError] = useState<string | null>(null);

	// Generate default session name: YYYYMMDDHHMM_username
	useEffect(() => {
		if (session?.user?.name) {
			const today = new Date();
			const dateStr = today
				.toLocaleDateString("ja-JP", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
					hour: "2-digit",
					minute: "2-digit",
				})
				.replace(/\//g, "");
			const defaultName = `${dateStr}_${session.user.name}`;
			setSessionName(defaultName);
		}
	}, [session]);

	const createSessionMutation = api.match.create.useMutation({
		onSuccess: (data) => {
			router.push(`/match/${data.id}`);
		},
		onError: (error) => {
			setError(error.message);
		},
	});

	// 既存ユーザーのプレイヤー候補
	const { data: selectablePlayers } = api.match.getSelectablePlayers.useQuery();

	// オートコンプリート用の値とハンドラ
	const getDummyName = (idx: number) => `プレイヤー${idx}`;

	type SelectOption = { label: string; kind: "user" | "dummy"; id?: string };
	const baseUserOptions: SelectOption[] = (selectablePlayers ?? []).map(
		(u) => ({
			label: u.name,
			kind: "user" as const,
			id: u.id,
		}),
	);
	const optionsForRow = (index: number): SelectOption[] => {
		const dummyLabel = `プレイヤー${index + 1}`;
		return [...baseUserOptions, { label: dummyLabel, kind: "dummy" as const }];
	};

	const handleGeneratePlayers = () => {
		setPlayers((prev) => {
			// 既存入力は保持し、足りない分だけダミーを追加
			if (playerCount <= prev.length) return prev;
			const start = prev.length;
			const toAdd = playerCount - prev.length;
			const added = Array.from({ length: toAdd }, (_, i) => ({
				id: `player-${start + i + 1}`,
				name: `プレイヤー${start + i + 1}`,
				userId: null,
			}));
			return [...prev, ...added];
		});
		setError(null);
	};

	const handleAutocompleteChange = (
		index: number,
		newValue: SelectOption | string | null,
	) => {
		const updated = [...players];
		const player = updated[index];
		if (!player) return;

		if (typeof newValue === "string") {
			updated[index] = { ...player, name: newValue, userId: null };
		} else if (newValue && newValue.kind === "user" && newValue.id) {
			updated[index] = { ...player, name: newValue.label, userId: newValue.id };
		} else if (newValue && newValue.kind === "dummy") {
			const defaultName = player.name?.trim()
				? player.name
				: getDummyName(index + 1);
			updated[index] = { ...player, name: defaultName, userId: null };
		} else {
			// cleared
			updated[index] = { ...player, name: "", userId: null };
		}
		setPlayers(updated);
	};

	const handleAutocompleteInputChange = (index: number, inputValue: string) => {
		const updated = [...players];
		const player = updated[index];
		if (!player) return;
		updated[index] = { ...player, name: inputValue, userId: null };
		setPlayers(updated);
	};

	const handleRemovePlayer = (index: number) => {
		const updated = players.filter((_, i) => i !== index);
		setPlayers(updated);
	};

	const handleAddPlayer = () => {
		setPlayers([
			...players,
			{
				id: `player-${players.length + 1}`,
				name: `プレイヤー${players.length + 1}`,
				userId: null,
			},
		]);
	};

	const handleCreateSession = () => {
		if (!sessionName.trim()) {
			setError("セッション名を入力してください");
			return;
		}

		if (players.length < 4) {
			setError("最低4人のプレイヤーが必要です");
			return;
		}

		createSessionMutation.mutate({
			name: sessionName,
			date: new Date(),
			players,
		});
	};

	return (
		<MainLayout>
			<Container maxWidth="md">
				<Box sx={{ mt: 4, mb: 4 }}>
					<Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
						<Typography component="h1" gutterBottom variant="h4">
							新規マッチング作成
						</Typography>
						<Button onClick={() => router.push("/match")} variant="outlined">
							一覧に戻る
						</Button>
					</Box>

					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					)}

					<Paper sx={{ p: 3, mb: 3 }}>
						<Typography gutterBottom variant="h6">
							セッション設定
						</Typography>

						<TextField
							fullWidth
							label="セッション名"
							onChange={(e) => setSessionName(e.target.value)}
							sx={{ mb: 2 }}
							value={sessionName}
						/>

						<Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
							<TextField
								inputProps={{ min: 4, max: 20 }}
								label="プレイヤー人数"
								onChange={(e) =>
									setPlayerCount(
										Math.max(4, Number.parseInt(e.target.value, 10)),
									)
								}
								sx={{ width: 200 }}
								type="number"
								value={playerCount}
							/>
							<Button onClick={handleGeneratePlayers} variant="contained">
								プレイヤー生成
							</Button>
						</Box>
					</Paper>

					{players.length > 0 && (
						<Paper sx={{ p: 3, mb: 3 }}>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									mb: 2,
								}}
							>
								<Typography variant="h6">プレイヤー一覧</Typography>
								<Button
									onClick={handleAddPlayer}
									startIcon={<AddIcon />}
									variant="outlined"
								>
									プレイヤー追加
								</Button>
							</Box>

							<List>
								{players.map((player, index) => (
									<ListItem
										key={player.id}
										secondaryAction={
											<IconButton
												edge="end"
												onClick={() => handleRemovePlayer(index)}
											>
												<DeleteIcon />
											</IconButton>
										}
									>
										<Autocomplete<SelectOption | string, false, false, true>
											freeSolo
											getOptionLabel={(option) =>
												typeof option === "string" ? option : option.label
											}
											isOptionEqualToValue={(option, value) => {
												if (
													typeof option === "string" ||
													typeof value === "string"
												)
													return false;
												if (option.kind !== value.kind) return false;
												if (option.kind === "user")
													return option.id === value.id;
												return (
													option.kind === "dummy" && value.kind === "dummy"
												);
											}}
											onChange={(_e, newValue) =>
												handleAutocompleteChange(index, newValue)
											}
											onInputChange={(_e, inputValue) =>
												handleAutocompleteInputChange(index, inputValue)
											}
											options={optionsForRow(index)}
											renderInput={(params) => (
												<TextField
													{...params}
													label={`プレイヤー${index + 1}`}
													size="small"
													sx={{ mr: 2, minWidth: 260 }}
												/>
											)}
											value={
												player.userId
													? ((optionsForRow(index).find(
															(o) =>
																typeof o !== "string" &&
																o.kind === "user" &&
																o.id === player.userId,
														) as SelectOption | undefined) ?? player.name)
													: /^プレイヤー\d+$/.test(player.name)
														? ((optionsForRow(index).find(
																(o) =>
																	typeof o !== "string" && o.kind === "dummy",
															) as SelectOption | undefined) ?? player.name)
														: player.name
											}
										/>
									</ListItem>
								))}
							</List>

							<Typography color="text.secondary" sx={{ mt: 2 }} variant="body2">
								合計: {players.length}人
							</Typography>
						</Paper>
					)}

					<Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
						<Button
							disabled={
								!sessionName ||
								players.length < 4 ||
								createSessionMutation.isPending
							}
							onClick={handleCreateSession}
							size="large"
							variant="contained"
						>
							{createSessionMutation.isPending ? "作成中..." : "マッチング作成"}
						</Button>
					</Box>
				</Box>
			</Container>
		</MainLayout>
	);
}

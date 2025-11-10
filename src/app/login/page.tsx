"use client";

import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Container,
	IconButton,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useThemeMode } from "~/providers/theme-provider";

export default function LoginPage() {
	const searchParams = useSearchParams();
	const { mode, toggleTheme } = useThemeMode();
	const [isLoading, setIsLoading] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const callbackUrl = searchParams.get("callbackUrl") ?? "/users";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			if (result?.error) {
				setError("メールアドレスまたはパスワードが正しくありません");
				setIsLoading(false);
			} else if (result?.ok) {
				window.location.href = callbackUrl;
			}
		} catch (error) {
			console.error("ログインエラー:", error);
			setError("ログイン中にエラーが発生しました");
			setIsLoading(false);
		}
	};

	return (
		<Container maxWidth="sm">
			<Box
				sx={{
					minHeight: "100vh",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					position: "relative",
				}}
			>
				{/* テーマ切り替えボタン */}
				<Box
					sx={{
						position: "absolute",
						top: 16,
						right: 16,
					}}
				>
					<Tooltip title={mode === "dark" ? "ライトモード" : "ダークモード"}>
						<IconButton color="inherit" onClick={toggleTheme}>
							{mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
						</IconButton>
					</Tooltip>
				</Box>

				<Card sx={{ width: "100%", boxShadow: 3 }}>
					<CardContent sx={{ p: 4 }}>
						<Box sx={{ textAlign: "center", mb: 4 }}>
							<Typography component="h1" gutterBottom variant="h4">
								Tennis Mate 2
							</Typography>
							<Typography color="text.secondary" variant="body1">
								ログインしてください
							</Typography>
						</Box>

						{error && (
							<Alert severity="error" sx={{ mb: 3 }}>
								{error}
							</Alert>
						)}

						<Box component="form" onSubmit={handleSubmit}>
							<TextField
								disabled={isLoading}
								fullWidth
								label="メールアドレス"
								margin="normal"
								onChange={(e) => setEmail(e.target.value)}
								required
								type="email"
								value={email}
							/>
							<TextField
								disabled={isLoading}
								fullWidth
								label="パスワード"
								margin="normal"
								onChange={(e) => setPassword(e.target.value)}
								required
								type="password"
								value={password}
							/>

							<Button
								disabled={isLoading}
								fullWidth
								size="large"
								sx={{ mt: 3, py: 1.5 }}
								type="submit"
								variant="contained"
							>
								{isLoading ? "ログイン中..." : "ログイン"}
							</Button>
						</Box>

						<Box sx={{ mt: 3, textAlign: "center" }}>
							<Typography color="text.secondary" variant="body2">
								テニス施設管理システム
							</Typography>
						</Box>
					</CardContent>
				</Card>
			</Box>
		</Container>
	);
}

"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { darkTheme, lightTheme } from "~/theme/theme";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
	mode: ThemeMode;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useThemeMode() {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useThemeMode must be used within AppThemeProvider");
	}
	return context;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
	const [mounted, setMounted] = useState(false);
	const [mode, setMode] = useState<ThemeMode>("dark");

	// クライアントサイドでのみ実行
	useEffect(() => {
		setMounted(true);
		// localStorageからテーマを読み込む
		const savedTheme = localStorage.getItem("theme") as ThemeMode | null;
		if (savedTheme) {
			setMode(savedTheme);
		}
	}, []);

	const toggleTheme = () => {
		setMode((prevMode) => {
			const newMode = prevMode === "light" ? "dark" : "light";
			// localStorageに保存
			localStorage.setItem("theme", newMode);
			return newMode;
		});
	};

	const theme = mode === "dark" ? darkTheme : lightTheme;

	// マウント前はダークテーマで統一（hydrationエラー防止）
	if (!mounted) {
		return (
			<ThemeContext.Provider value={{ mode: "dark", toggleTheme: () => {} }}>
				<ThemeProvider theme={darkTheme}>
					<CssBaseline />
					{children}
				</ThemeProvider>
			</ThemeContext.Provider>
		);
	}

	return (
		<ThemeContext.Provider value={{ mode, toggleTheme }}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				{children}
			</ThemeProvider>
		</ThemeContext.Provider>
	);
}

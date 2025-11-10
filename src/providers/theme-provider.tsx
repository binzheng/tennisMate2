"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { createContext, type ReactNode, useContext, useState } from "react";
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
	const [mode, setMode] = useState<ThemeMode>("dark");

	const toggleTheme = () => {
		setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
	};

	const theme = mode === "dark" ? darkTheme : lightTheme;

	return (
		<ThemeContext.Provider value={{ mode, toggleTheme }}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				{children}
			</ThemeProvider>
		</ThemeContext.Provider>
	);
}

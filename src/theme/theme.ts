import { createTheme } from "@mui/material/styles";

export const darkTheme = createTheme({
	palette: {
		mode: "dark",
		primary: {
			main: "#6366f1", // インディゴ
		},
		background: {
			default: "#1e293b", // 濃紺
			paper: "#334155", // 少し明るい濃紺
		},
		text: {
			primary: "#f1f5f9",
			secondary: "#cbd5e1",
		},
	},
	components: {
		MuiTableCell: {
			styleOverrides: {
				root: {
					borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
				},
				head: {
					fontWeight: 600,
					color: "#94a3b8",
				},
			},
		},
		MuiTableRow: {
			styleOverrides: {
				root: {
					"&:hover": {
						backgroundColor: "rgba(100, 116, 139, 0.08)",
					},
					"&.Mui-selected": {
						backgroundColor: "rgba(99, 102, 241, 0.12)",
						"&:hover": {
							backgroundColor: "rgba(99, 102, 241, 0.16)",
						},
					},
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					backgroundImage: "none",
				},
			},
		},
	},
});

export const lightTheme = createTheme({
	palette: {
		mode: "light",
		primary: {
			main: "#6366f1", // インディゴ
		},
		background: {
			default: "#f8fafc",
			paper: "#ffffff",
		},
		text: {
			primary: "#1e293b",
			secondary: "#64748b",
		},
	},
	components: {
		MuiTableCell: {
			styleOverrides: {
				root: {
					borderBottom: "1px solid rgba(226, 232, 240, 1)",
				},
				head: {
					fontWeight: 600,
					color: "#64748b",
				},
			},
		},
		MuiTableRow: {
			styleOverrides: {
				root: {
					"&:hover": {
						backgroundColor: "rgba(241, 245, 249, 1)",
					},
					"&.Mui-selected": {
						backgroundColor: "rgba(99, 102, 241, 0.08)",
						"&:hover": {
							backgroundColor: "rgba(99, 102, 241, 0.12)",
						},
					},
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					backgroundImage: "none",
				},
			},
		},
	},
});

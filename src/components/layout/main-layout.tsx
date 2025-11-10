"use client";

import { Box, Toolbar, useMediaQuery, useTheme } from "@mui/material";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

const DRAWER_WIDTH = 240;

interface MainLayoutProps {
	children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const [sidebarOpen, setSidebarOpen] = useState(true);

	// モバイルではデフォルトでサイドバーを閉じる
	useEffect(() => {
		setSidebarOpen(!isMobile);
	}, [isMobile]);

	const handleDrawerToggle = () => {
		setSidebarOpen(!sidebarOpen);
	};

	return (
		<Box sx={{ display: "flex" }}>
			<Header onMenuClick={handleDrawerToggle} />
			<Sidebar onClose={handleDrawerToggle} open={sidebarOpen} />
			<Box
				component="main"
				sx={{
					flexGrow: 1,
					p: { xs: 2, sm: 3 },
					width: {
						xs: "100%",
						sm: sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : "100%",
					},
					ml: {
						xs: 0,
						sm: sidebarOpen ? 0 : `-${DRAWER_WIDTH}px`,
					},
					transition: (theme) =>
						theme.transitions.create(["margin", "width"], {
							easing: theme.transitions.easing.sharp,
							duration: theme.transitions.duration.leavingScreen,
						}),
				}}
			>
				<Toolbar />
				{children}
			</Box>
		</Box>
	);
}

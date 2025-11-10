"use client";

import { Box, Toolbar } from "@mui/material";
import type { ReactNode } from "react";
import { useState } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

const DRAWER_WIDTH = 240;

interface MainLayoutProps {
	children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
	const [sidebarOpen, setSidebarOpen] = useState(true);

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
					p: 3,
					width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
					ml: sidebarOpen ? 0 : `-${DRAWER_WIDTH}px`,
					transition: (theme) =>
						theme.transitions.create(["margin"], {
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

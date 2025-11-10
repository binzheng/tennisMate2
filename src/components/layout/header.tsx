"use client";

import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/Settings";
import {
	AppBar,
	Avatar,
	alpha,
	Badge,
	Box,
	Divider,
	IconButton,
	InputBase,
	ListItemIcon,
	Menu,
	MenuItem,
	styled,
	Toolbar,
	Tooltip,
	Typography,
} from "@mui/material";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { useThemeMode } from "~/providers/theme-provider";

const Search = styled("div")(({ theme }) => ({
	position: "relative",
	borderRadius: theme.shape.borderRadius,
	backgroundColor: alpha(theme.palette.common.white, 0.05),
	"&:hover": {
		backgroundColor: alpha(theme.palette.common.white, 0.1),
	},
	marginRight: theme.spacing(2),
	marginLeft: theme.spacing(3),
	width: "auto",
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
	padding: theme.spacing(0, 2),
	height: "100%",
	position: "absolute",
	pointerEvents: "none",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
	color: "inherit",
	"& .MuiInputBase-input": {
		padding: theme.spacing(1, 1, 1, 0),
		paddingLeft: `calc(1em + ${theme.spacing(4)})`,
		transition: theme.transitions.create("width"),
		width: "100%",
		[theme.breakpoints.up("md")]: {
			width: "20ch",
		},
	},
}));

interface HeaderProps {
	onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
	const { data: session } = useSession();
	const { mode, toggleTheme } = useThemeMode();
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleLogout = async () => {
		await signOut({ callbackUrl: "/login" });
		handleClose();
	};

	return (
		<AppBar
			elevation={0}
			position="fixed"
			sx={{
				zIndex: (theme) => theme.zIndex.drawer + 1,
				bgcolor: "background.paper",
				borderBottom: 1,
				borderColor: "divider",
			}}
		>
			<Toolbar>
				<IconButton
					aria-label="open drawer"
					color="inherit"
					edge="start"
					onClick={onMenuClick}
					sx={{ mr: 2 }}
				>
					<MenuIcon />
				</IconButton>

				<Search>
					<SearchIconWrapper>
						<SearchIcon />
					</SearchIconWrapper>
					<StyledInputBase
						inputProps={{ "aria-label": "search" }}
						placeholder="Search"
					/>
				</Search>

				<Box sx={{ flexGrow: 1 }} />

				<Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
					<Tooltip title={mode === "dark" ? "ライトモード" : "ダークモード"}>
						<IconButton color="inherit" onClick={toggleTheme}>
							{mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
						</IconButton>
					</Tooltip>

					<IconButton color="inherit">
						<SettingsIcon />
					</IconButton>

					<IconButton color="inherit">
						<Badge badgeContent={4} color="error">
							<NotificationsIcon />
						</Badge>
					</IconButton>

					<Tooltip title="アカウント">
						<IconButton onClick={handleClick} sx={{ p: 0.5 }}>
							<Avatar
								alt={session?.user?.name ?? "User"}
								src={session?.user?.image ?? undefined}
								sx={{ width: 32, height: 32 }}
							>
								{!session?.user?.image &&
									(session?.user?.name?.[0]?.toUpperCase() ?? "U")}
							</Avatar>
						</IconButton>
					</Tooltip>

					<Menu
						anchorEl={anchorEl}
						anchorOrigin={{
							vertical: "bottom",
							horizontal: "right",
						}}
						onClose={handleClose}
						open={open}
						transformOrigin={{
							vertical: "top",
							horizontal: "right",
						}}
					>
						<Box sx={{ px: 2, py: 1 }}>
							<Typography variant="subtitle2">
								{session?.user?.name ?? "ゲスト"}
							</Typography>
							<Typography color="text.secondary" variant="body2">
								{session?.user?.email ?? ""}
							</Typography>
						</Box>
						<Divider />
						<MenuItem onClick={handleClose}>
							<ListItemIcon>
								<PersonIcon fontSize="small" />
							</ListItemIcon>
							プロフィール
						</MenuItem>
						<MenuItem onClick={handleLogout}>
							<ListItemIcon>
								<LogoutIcon fontSize="small" />
							</ListItemIcon>
							ログアウト
						</MenuItem>
					</Menu>
				</Box>
			</Toolbar>
		</AppBar>
	);
}

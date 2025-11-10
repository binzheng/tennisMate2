"use client";

import BusinessIcon from "@mui/icons-material/Business";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import GroupIcon from "@mui/icons-material/Group";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import TableChartIcon from "@mui/icons-material/TableChart";
import { Box, Collapse, Divider, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const DRAWER_WIDTH = 240;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [formsOpen, setFormsOpen] = useState(true);

  const menuItems = [
    {
      title: "E-commerce",
      icon: <BusinessIcon />,
      path: "/",
    },
    {
      title: "Invoice",
      icon: <NewspaperIcon />,
      path: "/invoice",
    },
    {
      title: "CRM",
      icon: <GroupIcon />,
      path: "/crm",
    },
    {
      title: "Blog",
      icon: <DashboardIcon />,
      path: "/blog",
    },
  ];

  const masterItems = [{ title: "ユーザー", path: "/users" }];

  return (
    <Drawer
      anchor="left"
      onClose={onClose}
      open={open}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          bgcolor: "background.paper",
          borderRight: 1,
          borderColor: "divider",
        },
      }}
      variant="persistent"
    >
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography color="white" fontWeight="bold" variant="h6">
              B
            </Typography>
          </Box>
          <Typography fontWeight="bold" variant="h6">
            BERRY
          </Typography>
        </Box>
      </Toolbar>

      <Divider />

      <List>
        {menuItems.map((item) => (
          <ListItem disablePadding key={item.path}>
            <ListItemButton component={Link} href={item.path} selected={pathname === item.path}>
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => setFormsOpen(!formsOpen)}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <TableChartIcon />
            </ListItemIcon>
            <ListItemText primary="マスタ" />
            {formsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={formsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {masterItems.map((item) => (
              <ListItem disablePadding key={item.path}>
                <ListItemButton component={Link} href={item.path} selected={pathname === item.path} sx={{ pl: 4 }}>
                  <ListItemText primary={item.title} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
      </List>
    </Drawer>
  );
}

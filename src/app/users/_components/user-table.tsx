"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import { useState } from "react";
import { api } from "~/trpc/react";

interface User {
  id: string;
  userId: string | null;
  name: string | null;
  email: string | null;
  role: "player" | "coach" | "operator" | "admin";
}

interface UserTableProps {
  users: User[];
  onEdit: (userId: string) => void;
}

const roleConfig = {
  admin: { label: "管理者", color: "error" as const },
  operator: { label: "オペレーター", color: "warning" as const },
  coach: { label: "コーチ", color: "info" as const },
  player: { label: "プレイヤー", color: "success" as const },
};

export function UserTable({ users, onEdit }: UserTableProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const utils = api.useUtils();
  const deleteMutation = api.user.delete.useMutation({
    onSuccess: () => {
      void utils.user.getAll.invalidate();
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    },
    onError: (error) => {
      setErrorMessage(error.message);
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
    },
  });

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      deleteMutation.mutate({ id: deleteTargetId });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setDeleteTargetId(null);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = users.map((user) => user.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleSelectClick = (id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }

    setSelected(newSelected);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (id: string) => selected.indexOf(id) !== -1;

  const paginatedUsers = users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (users.length === 0) {
    return <Paper sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>ユーザーが登録されていません</Paper>;
  }

  return (
    <>
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={users.length > 0 && selected.length === users.length}
                  color="primary"
                  indeterminate={selected.length > 0 && selected.length < users.length}
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>ユーザーID</TableCell>
              <TableCell>名前</TableCell>
              <TableCell>メールアドレス</TableCell>
              <TableCell>ロール</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.map((user, index) => {
              const isItemSelected = isSelected(user.id);
              return (
                <TableRow hover key={user.id} onClick={() => handleSelectClick(user.id)} role="checkbox" selected={isItemSelected} sx={{ cursor: "pointer" }}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={isItemSelected} color="primary" />
                  </TableCell>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  <TableCell>{user.userId ?? "-"}</TableCell>
                  <TableCell>{user.name ?? "-"}</TableCell>
                  <TableCell>{user.email ?? "-"}</TableCell>
                  <TableCell>
                    <Chip color={roleConfig[user.role].color} label={roleConfig[user.role].label} size="small" />
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <IconButton aria-label="編集" color="primary" onClick={() => onEdit(user.id)} size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton aria-label="削除" color="error" disabled={deleteMutation.isPending} onClick={() => handleDelete(user.id)} size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ページネーション */}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <TablePagination
          component="div"
          count={users.length}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[20, 50, 100]}
        />
      </Box>

      {/* 削除確認ダイアログ */}
      <Dialog fullWidth maxWidth="sm" onClose={handleDeleteCancel} open={deleteConfirmOpen}>
        <DialogTitle>確認</DialogTitle>
        <DialogContent>
          <DialogContentText>このユーザーを削除してもよろしいですか？</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>キャンセル</Button>
          <Button color="error" disabled={deleteMutation.isPending} onClick={handleDeleteConfirm} variant="contained">
            {deleteMutation.isPending ? "削除中..." : "削除"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* エラーダイアログ */}
      <Dialog fullWidth maxWidth="sm" onClose={() => setErrorMessage(null)} open={errorMessage !== null}>
        <DialogTitle>エラー</DialogTitle>
        <DialogContent>
          <DialogContentText>{errorMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorMessage(null)} variant="contained">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Backdrop,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	TextField,
} from "@mui/material";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	type CreateLessonInput,
	lessonFormSchema,
} from "~/lib/validations/lesson.schema";
import { api } from "~/trpc/react";

// Form data type - スキーマから型を推論
type LessonFormData = CreateLessonInput;

interface LessonDialogProps {
	open: boolean;
	lessonId: string | null;
	onClose: () => void;
}

// 曜日の選択肢
const dayOfWeekOptions = [
	{ value: "monday", label: "月曜日" },
	{ value: "tuesday", label: "火曜日" },
	{ value: "wednesday", label: "水曜日" },
	{ value: "thursday", label: "木曜日" },
	{ value: "friday", label: "金曜日" },
	{ value: "saturday", label: "土曜日" },
	{ value: "sunday", label: "日曜日" },
];

// 時間枠の選択肢
const durationOptions = [
	{ value: "60", label: "1時間" },
	{ value: "90", label: "1時間半" },
	{ value: "120", label: "2時間" },
];

export function LessonDialog({ open, lessonId, onClose }: LessonDialogProps) {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const utils = api.useUtils();
	const isEditing = lessonId !== null;

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<LessonFormData>({
		resolver: zodResolver(lessonFormSchema),
		mode: "onChange",
		defaultValues: {
			courtId: "court1",
			coachId: null,
			capacity: 1,
			dayOfWeek: "monday",
			startTime: "09:00",
			duration: "60",
		},
	});

	// 編集時にデータを取得
	const { data: lessons } = api.lesson.getAll.useQuery();
	const existingLesson = lessons?.find((l) => l.id === lessonId);

	// コーチ一覧を取得
	const { data: coaches = [] } = api.user.getCoaches.useQuery();

	// コート一覧を取得
	const { data: courts = [] } = api.lesson.getCourts.useQuery();

	const createMutation = api.lesson.create.useMutation({
		onSuccess: () => {
			void utils.lesson.getAll.invalidate();
			onClose();
			reset();
		},
		onError: (error) => {
			setErrorMessage(error.message);
		},
	});

	const updateMutation = api.lesson.update.useMutation({
		onSuccess: () => {
			void utils.lesson.getAll.invalidate();
			onClose();
			reset();
		},
		onError: (error) => {
			setErrorMessage(error.message);
		},
	});

	useEffect(() => {
		if (existingLesson) {
			reset({
				courtId: existingLesson.courtId,
				coachId: existingLesson.coachId,
				capacity: existingLesson.capacity,
				dayOfWeek: existingLesson.dayOfWeek as LessonFormData["dayOfWeek"],
				startTime: existingLesson.startTime,
				duration: existingLesson.duration as "60" | "90" | "120",
			});
		}
	}, [existingLesson, reset]);

	const onSubmit = (data: LessonFormData) => {
		if (isEditing) {
			updateMutation.mutate({ id: lessonId, ...data });
		} else {
			createMutation.mutate(data);
		}
	};

	const handleClose = () => {
		onClose();
		reset();
		setErrorMessage(null);
	};

	const isLoading = createMutation.isPending || updateMutation.isPending;

	return (
		<>
			<Dialog fullWidth maxWidth="sm" onClose={handleClose} open={open}>
				<form onSubmit={handleSubmit(onSubmit)}>
					<DialogTitle>
						{isEditing ? "レッスン編集" : "レッスン新規作成"}
					</DialogTitle>
					<DialogContent sx={{ position: "relative" }}>
						<Controller
							control={control}
							name="courtId"
							render={({ field }) => (
								<FormControl error={!!errors.courtId} fullWidth margin="normal">
									<InputLabel>コート</InputLabel>
									<Select {...field} label="コート">
										{courts.map((court) => (
											<MenuItem key={court.id} value={court.id}>
												{court.name}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							)}
						/>

						<Controller
							control={control}
							name="coachId"
							render={({ field }) => (
								<FormControl error={!!errors.coachId} fullWidth margin="normal">
									<InputLabel>コーチ（任意）</InputLabel>
									<Select
										{...field}
										label="コーチ（任意）"
										onChange={(e) =>
											field.onChange(
												e.target.value === "" ? null : e.target.value,
											)
										}
										value={field.value ?? ""}
									>
										<MenuItem value="">
											<em>なし</em>
										</MenuItem>
										{coaches.map((coach) => (
											<MenuItem key={coach.id} value={coach.id}>
												{coach.name ?? coach.userId}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							)}
						/>

						<Controller
							control={control}
							name="capacity"
							render={({ field }) => (
								<TextField
									{...field}
									error={!!errors.capacity}
									fullWidth
									helperText={errors.capacity?.message}
									label="定員"
									margin="normal"
									onChange={(e) =>
										field.onChange(Number.parseInt(e.target.value, 10))
									}
									type="number"
								/>
							)}
						/>

						<Controller
							control={control}
							name="dayOfWeek"
							render={({ field }) => (
								<FormControl
									error={!!errors.dayOfWeek}
									fullWidth
									margin="normal"
								>
									<InputLabel>曜日</InputLabel>
									<Select {...field} label="曜日">
										{dayOfWeekOptions.map((option) => (
											<MenuItem key={option.value} value={option.value}>
												{option.label}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							)}
						/>

						<Controller
							control={control}
							name="startTime"
							render={({ field }) => (
								<LocalizationProvider dateAdapter={AdapterDayjs}>
									<TimePicker
										ampm={false}
										format="HH:mm"
										label="開始時刻"
										onChange={(newValue) => {
											field.onChange(
												newValue ? dayjs(newValue).format("HH:mm") : "",
											);
										}}
										slotProps={{
											textField: {
												fullWidth: true,
												margin: "normal",
												error: !!errors.startTime,
												helperText: errors.startTime?.message,
											},
										}}
										value={
											field.value ? dayjs(`2000-01-01 ${field.value}`) : null
										}
									/>
								</LocalizationProvider>
							)}
						/>

						<Controller
							control={control}
							name="duration"
							render={({ field }) => (
								<FormControl
									error={!!errors.duration}
									fullWidth
									margin="normal"
								>
									<InputLabel>時間枠</InputLabel>
									<Select {...field} label="時間枠">
										{durationOptions.map((option) => (
											<MenuItem key={option.value} value={option.value}>
												{option.label}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							)}
						/>

						{/* ローディング中のBackdrop */}
						<Backdrop
							open={isLoading}
							sx={{
								position: "absolute",
								zIndex: (theme) => theme.zIndex.drawer + 1,
								color: "#fff",
								backgroundColor: "rgba(0, 0, 0, 0.5)",
							}}
						>
							<CircularProgress color="inherit" />
						</Backdrop>
					</DialogContent>
					<DialogActions>
						<Button disabled={isLoading} onClick={handleClose}>
							キャンセル
						</Button>
						<Button disabled={isLoading} type="submit" variant="contained">
							{isLoading ? "処理中..." : isEditing ? "更新" : "作成"}
						</Button>
					</DialogActions>
				</form>
			</Dialog>

			<Dialog
				fullWidth
				maxWidth="sm"
				onClose={() => setErrorMessage(null)}
				open={errorMessage !== null}
			>
				<DialogTitle>エラー</DialogTitle>
				<DialogContent>{errorMessage}</DialogContent>
				<DialogActions>
					<Button onClick={() => setErrorMessage(null)} variant="contained">
						閉じる
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

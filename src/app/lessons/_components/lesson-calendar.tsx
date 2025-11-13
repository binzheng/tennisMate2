"use client";

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Paper } from "@mui/material";
import { useMemo } from "react";

// Import FullCalendar styles
import "@fullcalendar/core/index.js";
import "~/styles/fullcalendar-custom.css";

interface Lesson {
	id: string;
	courtId: string;
	courtName?: string;
	coachId: string | null;
	capacity: number;
	dayOfWeek: string;
	startTime: string;
	endTime: string;
	duration: string;
}

interface LessonCalendarProps {
	lessons: Lesson[];
	onEventClick?: (lessonId: string) => void;
}

// 曜日のマッピング
const dayOfWeekMap: Record<string, number> = {
	sunday: 0,
	monday: 1,
	tuesday: 2,
	wednesday: 3,
	thursday: 4,
	friday: 5,
	saturday: 6,
};

export function LessonCalendar({ lessons, onEventClick }: LessonCalendarProps) {
	// レッスンデータをFullCalendarのイベント形式に変換
	const events = useMemo(() => {
		// 現在の週の日曜日を取得
		const now = new Date();
		const currentDay = now.getDay();
		const sundayDate = new Date(now);
		sundayDate.setDate(now.getDate() - currentDay);
		sundayDate.setHours(0, 0, 0, 0);

		return lessons.map((lesson) => {
			const dayIndex = dayOfWeekMap[lesson.dayOfWeek] ?? 0;

			// 曜日に対応する日付を計算
			const eventDate = new Date(sundayDate);
			eventDate.setDate(sundayDate.getDate() + dayIndex);

			// 開始時刻と終了時刻を設定
			const [startHour, startMinute] = lesson.startTime.split(":").map(Number);
			const [endHour, endMinute] = lesson.endTime.split(":").map(Number);

			const startDate = new Date(eventDate);
			startDate.setHours(startHour ?? 0, startMinute ?? 0, 0, 0);

			const endDate = new Date(eventDate);
			endDate.setHours(endHour ?? 0, endMinute ?? 0, 0, 0);

			return {
				id: lesson.id,
				title: `${lesson.courtName ?? lesson.courtId} (定員: ${lesson.capacity})`,
				start: startDate,
				end: endDate,
				backgroundColor: "#1976d2",
				borderColor: "#1565c0",
				extendedProps: {
					lessonId: lesson.id,
					courtName: lesson.courtName,
					capacity: lesson.capacity,
				},
			};
		});
	}, [lessons]);

	return (
		<Paper sx={{ p: 2 }}>
			<FullCalendar
				allDaySlot={false}
				eventClick={(info) => {
					if (onEventClick) {
						onEventClick(info.event.id);
					}
				}}
				eventDisplay="block"
				events={events}
				headerToolbar={{
					left: "prev,next today",
					center: "title",
					right: "dayGridMonth,timeGridWeek,timeGridDay",
				}}
				height="auto"
				initialView="timeGridWeek"
				locale="ja"
				plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
				slotMaxTime="22:00:00"
				slotMinTime="06:00:00"
			/>
		</Paper>
	);
}

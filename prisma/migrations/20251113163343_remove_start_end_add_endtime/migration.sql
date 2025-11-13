-- AlterTable: Remove start and end columns, add endTime column
-- First delete all data to avoid constraint issues
DELETE FROM "LessonReservation";
DELETE FROM "LessonSlot";

-- Drop the old index
DROP INDEX "LessonSlot_courtId_start_end_idx";

-- Drop columns
ALTER TABLE "LessonSlot" DROP COLUMN "start";
ALTER TABLE "LessonSlot" DROP COLUMN "end";

-- Add endTime column
ALTER TABLE "LessonSlot" ADD COLUMN "endTime" TEXT NOT NULL DEFAULT '00:00';

-- Create new index
CREATE INDEX "LessonSlot_courtId_dayOfWeek_startTime_idx" ON "LessonSlot"("courtId", "dayOfWeek", "startTime");

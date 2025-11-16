-- AlterTable
ALTER TABLE "LessonSlot" ALTER COLUMN "endTime" DROP DEFAULT;

-- CreateTable
CREATE TABLE "MatchSession" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "playerCount" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchGame" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "gameNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "winner" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchGamePlayer" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT,
    "playerName" TEXT NOT NULL,
    "team" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchGamePlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchSession_date_idx" ON "MatchSession"("date");

-- CreateIndex
CREATE INDEX "MatchSession_createdBy_idx" ON "MatchSession"("createdBy");

-- CreateIndex
CREATE INDEX "MatchGame_sessionId_gameNumber_idx" ON "MatchGame"("sessionId", "gameNumber");

-- CreateIndex
CREATE INDEX "MatchGamePlayer_gameId_idx" ON "MatchGamePlayer"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchGamePlayer_gameId_position_key" ON "MatchGamePlayer"("gameId", "position");

-- AddForeignKey
ALTER TABLE "MatchGame" ADD CONSTRAINT "MatchGame_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "MatchSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchGamePlayer" ADD CONSTRAINT "MatchGamePlayer_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "MatchGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchGamePlayer" ADD CONSTRAINT "MatchGamePlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

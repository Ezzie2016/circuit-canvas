-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_recipientId_fkey";

-- AlterTable
ALTER TABLE "AttendanceRecord" ADD COLUMN     "attendedAt" TIMESTAMP(3),
ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "leftAt" TIMESTAMP(3),
ADD COLUMN     "liveSessionId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "verifiedByTeacher" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

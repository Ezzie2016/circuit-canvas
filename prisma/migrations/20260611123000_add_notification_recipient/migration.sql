-- Add recipientId to Notification for per-user notifications
ALTER TABLE "Notification"
ADD COLUMN "recipientId" TEXT NULL;

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

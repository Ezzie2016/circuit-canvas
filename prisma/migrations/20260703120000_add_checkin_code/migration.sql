-- AlterTable
ALTER TABLE "LiveSession" ADD COLUMN     "checkInCode" TEXT;
ALTER TABLE "LiveSession" ADD COLUMN     "checkInCodeExpiresAt" TIMESTAMP(3);

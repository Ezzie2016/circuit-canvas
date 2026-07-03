-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('ASSIGNMENT', 'QUIZ', 'MID_SEMESTER', 'EXAM');

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN "type" "AssignmentType" NOT NULL DEFAULT 'ASSIGNMENT';

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "totalMarks" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "earnedMarks" INTEGER;

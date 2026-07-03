-- AlterTable: remove redundant grade string (earnedMarks + totalMarks are the source of truth)
ALTER TABLE "Submission" DROP COLUMN IF EXISTS "grade";

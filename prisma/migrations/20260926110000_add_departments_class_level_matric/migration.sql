-- These objects were in schema.prisma but in no migration (they were most
-- likely applied with `prisma db push`), so `migrate deploy` could not build
-- the schema on a fresh database. Every statement is idempotent: it creates
-- what is missing and is a no-op where the object already exists.

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ClassLevel" AS ENUM ('JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "classLevel" "ClassLevel",
ADD COLUMN IF NOT EXISTS "code" TEXT,
ADD COLUMN IF NOT EXISTS "departmentId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "matricNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_matricNumber_key" ON "User"("matricNumber");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "Course" ADD CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

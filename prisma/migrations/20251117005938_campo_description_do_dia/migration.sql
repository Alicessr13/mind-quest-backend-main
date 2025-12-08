/*
  Warnings:

  - You are about to drop the column `description` on the `Content` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Content" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "StudyPlanDay" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '';

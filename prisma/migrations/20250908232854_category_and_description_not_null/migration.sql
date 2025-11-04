/*
  Warnings:

  - Made the column `description` on table `Item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `category` on table `Item` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Item" ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "category" SET NOT NULL;

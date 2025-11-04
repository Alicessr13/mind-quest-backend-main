/*
  Warnings:

  - Added the required column `face` to the `users` table without a default value. This is not possible if the table is not empty.
  - Made the column `body` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "Slot" ADD VALUE 'Face';

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_body_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "face" INTEGER NOT NULL,
ALTER COLUMN "body" SET NOT NULL;

-- CreateTable
CREATE TABLE "Inventory" (
    "inventory_id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_id" INTEGER NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("inventory_id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_body_fkey" FOREIGN KEY ("body") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_face_fkey" FOREIGN KEY ("face") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

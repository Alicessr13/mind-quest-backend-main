/*
  Warnings:

  - You are about to drop the `Character` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Inventory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserMascot` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Slot" AS ENUM ('SkinTop', 'SkinBottom', 'SkinTopAndBottom', 'Shoes', 'Hair', 'Accessory', 'Body', 'HandAccessory');

-- DropForeignKey
ALTER TABLE "Character" DROP CONSTRAINT "Character_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_item_id_fkey";

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_user_id_fkey";

-- DropForeignKey
ALTER TABLE "UserMascot" DROP CONSTRAINT "UserMascot_item_id_fkey";

-- DropForeignKey
ALTER TABLE "UserMascot" DROP CONSTRAINT "UserMascot_user_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accessory" INTEGER,
ADD COLUMN     "body" INTEGER,
ADD COLUMN     "hair" INTEGER,
ADD COLUMN     "hand_accessory" INTEGER,
ADD COLUMN     "shoes" INTEGER,
ADD COLUMN     "skin_bottom" INTEGER,
ADD COLUMN     "skin_top" INTEGER;

-- DropTable
DROP TABLE "Character";

-- DropTable
DROP TABLE "Inventory";

-- DropTable
DROP TABLE "Item";

-- DropTable
DROP TABLE "UserMascot";

-- DropEnum
DROP TYPE "ItemType";

-- CreateTable
CREATE TABLE "items" (
    "item_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "slot" "Slot" NOT NULL,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("item_id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_skin_top_fkey" FOREIGN KEY ("skin_top") REFERENCES "items"("item_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_skin_bottom_fkey" FOREIGN KEY ("skin_bottom") REFERENCES "items"("item_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_shoes_fkey" FOREIGN KEY ("shoes") REFERENCES "items"("item_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_hair_fkey" FOREIGN KEY ("hair") REFERENCES "items"("item_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_accessory_fkey" FOREIGN KEY ("accessory") REFERENCES "items"("item_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_body_fkey" FOREIGN KEY ("body") REFERENCES "items"("item_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_hand_accessory_fkey" FOREIGN KEY ("hand_accessory") REFERENCES "items"("item_id") ON DELETE SET NULL ON UPDATE CASCADE;

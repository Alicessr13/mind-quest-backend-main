-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('Character', 'Mascot');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Character" (
    "character_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "skin_top" TEXT,
    "skin_bottom" TEXT,
    "shoe" TEXT,
    "hair" TEXT,
    "accessory" TEXT,
    "body" TEXT,
    "hand_accessory" TEXT,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("character_id")
);

-- CreateTable
CREATE TABLE "Item" (
    "item_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "type" "ItemType" NOT NULL,
    "category" TEXT,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "inventory_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("inventory_id")
);

-- CreateTable
CREATE TABLE "UserMascot" (
    "user_mascot_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserMascot_pkey" PRIMARY KEY ("user_mascot_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Character_user_id_key" ON "Character"("user_id");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "Item"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMascot" ADD CONSTRAINT "UserMascot_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMascot" ADD CONSTRAINT "UserMascot_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "Item"("item_id") ON DELETE RESTRICT ON UPDATE CASCADE;

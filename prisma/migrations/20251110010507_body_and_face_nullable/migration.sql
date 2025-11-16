-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_body_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_face_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "body" DROP NOT NULL,
ALTER COLUMN "body" DROP DEFAULT,
ALTER COLUMN "face" DROP NOT NULL,
ALTER COLUMN "face" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_body_fkey" FOREIGN KEY ("body") REFERENCES "items"("item_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_face_fkey" FOREIGN KEY ("face") REFERENCES "items"("item_id") ON DELETE SET NULL ON UPDATE CASCADE;

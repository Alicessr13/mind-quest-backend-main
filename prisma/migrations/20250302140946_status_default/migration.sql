-- AlterTable
ALTER TABLE "Content" ALTER COLUMN "status" SET DEFAULT 'Waiting';

-- AlterTable
ALTER TABLE "StudyPlan" ALTER COLUMN "status" SET DEFAULT 'Waiting';

-- AlterTable
ALTER TABLE "StudyPlanDay" ALTER COLUMN "status" SET DEFAULT 'Waiting';

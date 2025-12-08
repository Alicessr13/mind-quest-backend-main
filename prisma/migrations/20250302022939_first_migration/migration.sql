-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Completed', 'Canceled', 'Waiting', 'InProgress', 'Overdue');

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "StudyPlan" (
    "study_plan_id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "week_days" INTEGER[],
    "minutes_per_day" INTEGER NOT NULL,
    "total_minutes" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "StudyPlan_pkey" PRIMARY KEY ("study_plan_id")
);

-- CreateTable
CREATE TABLE "Content" (
    "content_id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "allocated_minutes" INTEGER NOT NULL,
    "studied_minutes" INTEGER NOT NULL,
    "study_plan_id" INTEGER NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("content_id")
);

-- CreateTable
CREATE TABLE "StudyPlanDay" (
    "study_plan_day_id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "Status" NOT NULL,
    "allocated_minutes" INTEGER NOT NULL,
    "studied_minutes" INTEGER NOT NULL,
    "content_id" INTEGER NOT NULL,

    CONSTRAINT "StudyPlanDay_pkey" PRIMARY KEY ("study_plan_day_id")
);

-- AddForeignKey
ALTER TABLE "StudyPlan" ADD CONSTRAINT "StudyPlan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_study_plan_id_fkey" FOREIGN KEY ("study_plan_id") REFERENCES "StudyPlan"("study_plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyPlanDay" ADD CONSTRAINT "StudyPlanDay_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "Content"("content_id") ON DELETE RESTRICT ON UPDATE CASCADE;

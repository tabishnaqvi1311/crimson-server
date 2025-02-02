/*
  Warnings:

  - You are about to drop the column `pay` on the `Job` table. All the data in the column will be lost.
  - Added the required column `salary` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workLocation` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workType` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorkLocation" AS ENUM ('REMOTE', 'ONSITE', 'HYBRID');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('FULL_TIME', 'PART_TIME', 'PROJECT_BASED');

-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'EXPIRED';

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_applicantId_fkey";

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_jobId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_posterId_fkey";

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "pay",
ADD COLUMN     "categories" TEXT[],
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "salary" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "workLocation" "WorkLocation" NOT NULL,
ADD COLUMN     "workType" "WorkType" NOT NULL;

-- CreateTable
CREATE TABLE "YoutuberProfile" (
    "id" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "youtubeUsername" TEXT NOT NULL,
    "about" TEXT,
    "subscribers" INTEGER,
    "views" INTEGER,
    "videos" INTEGER,
    "userId" TEXT NOT NULL,

    CONSTRAINT "YoutuberProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentProfile" (
    "id" TEXT NOT NULL,
    "about" TEXT,
    "rate" INTEGER NOT NULL,
    "workLocation" "WorkLocation" NOT NULL,
    "workType" "WorkType" NOT NULL,
    "topSkill" TEXT NOT NULL,
    "skills" TEXT[],
    "location" TEXT NOT NULL,
    "experience" TEXT,
    "languages" TEXT[],
    "categories" TEXT[],
    "clients" TEXT[],
    "userId" TEXT NOT NULL,

    CONSTRAINT "TalentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YoutuberProfile_youtubeUsername_key" ON "YoutuberProfile"("youtubeUsername");

-- CreateIndex
CREATE UNIQUE INDEX "YoutuberProfile_userId_key" ON "YoutuberProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TalentProfile_userId_key" ON "TalentProfile"("userId");

-- AddForeignKey
ALTER TABLE "YoutuberProfile" ADD CONSTRAINT "YoutuberProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentProfile" ADD CONSTRAINT "TalentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

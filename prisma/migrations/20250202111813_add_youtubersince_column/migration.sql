/*
  Warnings:

  - Added the required column `youtuberSince` to the `YoutuberProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "YoutuberProfile" ADD COLUMN     "youtuberSince" TIMESTAMP(3) NOT NULL;

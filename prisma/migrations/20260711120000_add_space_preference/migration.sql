-- CreateEnum
CREATE TYPE "SpacePreference" AS ENUM ('INDOOR', 'OUTDOOR', 'ANY');

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN "spacePreference" "SpacePreference";

-- AlterTable
ALTER TABLE "site_settings" ALTER COLUMN "hoursLine1" SET DEFAULT 'Service du midi de 12h à 14h.',
ALTER COLUMN "hoursLine2" SET DEFAULT 'Service du soir de 19h à 21h',
ALTER COLUMN "hoursLine3" SET DEFAULT 'Du Lundi au Vendredi';

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "imageUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_date_idx" ON "events"("date");

-- CreateTable
CREATE TABLE "weekly_opening_hours" (
    "id" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "lunchOpen" BOOLEAN NOT NULL DEFAULT true,
    "dinnerOpen" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_opening_hours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_opening_hours_dayOfWeek_key" ON "weekly_opening_hours"("dayOfWeek");

-- Seed default rows: open every day, both services (matches current de facto behavior)
INSERT INTO "weekly_opening_hours" ("id", "dayOfWeek", "lunchOpen", "dinnerOpen", "updatedAt")
VALUES
    (gen_random_uuid()::text, 0, true, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 1, true, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 2, true, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 3, true, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 4, true, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 5, true, true, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 6, true, true, CURRENT_TIMESTAMP);

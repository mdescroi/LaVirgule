-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "hoursLine1" TEXT NOT NULL DEFAULT 'De janvier à août : ouvert uniquement le midi, de 12h à 14h.',
    "hoursLine2" TEXT NOT NULL DEFAULT 'Groupes acceptés le soir à partir de 15 personnes (janv. à août).',
    "hoursLine3" TEXT NOT NULL DEFAULT 'De septembre à décembre : midi 12h–14h · soir 19h–21h30.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

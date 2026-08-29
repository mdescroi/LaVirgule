import { prisma } from "@/lib/prisma";

/** Ordre d'affichage Lundi → Dimanche, avec le code JS Date#getUTCDay() (0 = dimanche) pour chacun. */
export const WEEKDAYS_DISPLAY_ORDER = [
  { dayOfWeek: 1, label: "Lundi" },
  { dayOfWeek: 2, label: "Mardi" },
  { dayOfWeek: 3, label: "Mercredi" },
  { dayOfWeek: 4, label: "Jeudi" },
  { dayOfWeek: 5, label: "Vendredi" },
  { dayOfWeek: 6, label: "Samedi" },
  { dayOfWeek: 0, label: "Dimanche" },
] as const;

const WEEKDAY_LABEL_BY_INDEX: Record<number, string> = Object.fromEntries(
  WEEKDAYS_DISPLAY_ORDER.map((d) => [d.dayOfWeek, d.label])
);

export function weekdayLabel(dayOfWeek: number): string {
  return WEEKDAY_LABEL_BY_INDEX[dayOfWeek] ?? "";
}

export type OpeningRow = { dayOfWeek: number; lunchOpen: boolean; dinnerOpen: boolean };

/** Récupère le planning hebdomadaire, avec repli "ouvert" si une ligne manque (ne doit pas arriver après la migration). */
export async function getWeeklyOpeningHours(): Promise<OpeningRow[]> {
  const rows = await prisma.weeklyOpeningHours.findMany();
  const byDay = new Map(rows.map((r) => [r.dayOfWeek, r]));
  return WEEKDAYS_DISPLAY_ORDER.map(({ dayOfWeek }) => {
    const row = byDay.get(dayOfWeek);
    return {
      dayOfWeek,
      lunchOpen: row?.lunchOpen ?? true,
      dinnerOpen: row?.dinnerOpen ?? true,
    };
  });
}

/** Le service (midi/soir) est-il ouvert le jour de semaine de cette date, d'après le planning par défaut ? */
export async function isServiceOpen(date: Date, slot: "LUNCH" | "DINNER"): Promise<boolean> {
  const dayOfWeek = date.getUTCDay();
  const row = await prisma.weeklyOpeningHours.findUnique({ where: { dayOfWeek } });
  if (!row) return true;
  return slot === "LUNCH" ? row.lunchOpen : row.dinnerOpen;
}

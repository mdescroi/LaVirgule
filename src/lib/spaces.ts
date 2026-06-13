import { prisma } from "@/lib/prisma";

/**
 * Retourne les IDs des espaces privatisés (bloqués) pour un créneau donné :
 * une salle est bloquée si une réservation de groupe CONFIRMÉE y est assignée
 * pour cette même date ET ce même service.
 */
export async function getBlockedSpaceIds(
  dateStr: string,
  slot: "LUNCH" | "DINNER"
): Promise<string[]> {
  if (!dateStr) return [];

  const day = new Date(dateStr);
  if (Number.isNaN(day.getTime())) return [];
  day.setUTCHours(0, 0, 0, 0);
  const next = new Date(day);
  next.setUTCDate(next.getUTCDate() + 1);

  const blocked = await prisma.reservation
    .findMany({
      where: {
        isGroup: true,
        status: "CONFIRMED",
        slot,
        date: { gte: day, lt: next },
        spaceId: { not: null },
      },
      select: { spaceId: true },
    })
    .catch(() => []);

  return blocked.map((r) => r.spaceId as string);
}

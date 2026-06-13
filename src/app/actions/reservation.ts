"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { reservationSchema } from "@/lib/validations";
import { RESTAURANT } from "@/lib/config";

export type ReservationResult =
  | { success: true; isGroup: boolean }
  | { success: false; error: string };

export async function createReservation(
  formData: FormData
): Promise<ReservationResult> {
  const raw = {
    firstName: formData.get("firstName"),
    customerName: formData.get("customerName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    date: formData.get("date"),
    slot: formData.get("slot"),
    guestCount: formData.get("guestCount"),
    spaceId: formData.get("spaceId") || undefined,
    message: formData.get("message") || undefined,
  };

  const parsed = reservationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const data = parsed.data;
  const reservationDate = new Date(data.date);
  if (reservationDate < new Date(new Date().toDateString())) {
    return { success: false, error: "La date doit être dans le futur." };
  }

  // Logique B2B : >= 12 personnes → demande de privatisation (PENDING)
  const isGroup = data.guestCount >= RESTAURANT.groupThreshold;

  // Vérifie que l'espace existe si fourni (et ignore la valeur "any")
  let spaceId: string | null = null;
  if (data.spaceId && data.spaceId !== "any") {
    const space = await prisma.space.findUnique({ where: { id: data.spaceId } });
    if (!space) return { success: false, error: "Espace inconnu." };
    spaceId = space.id;
  }

  try {
    await prisma.reservation.create({
      data: {
        firstName: data.firstName,
        customerName: data.customerName,
        email: data.email,
        phone: data.phone,
        date: reservationDate,
        slot: data.slot,
        guestCount: data.guestCount,
        status: isGroup ? "PENDING" : "CONFIRMED",
        isGroup,
        message: data.message ?? null,
        spaceId,
      },
    });
  } catch {
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez nous appeler au " + RESTAURANT.phone,
    };
  }

  revalidatePath("/admin/reservations");
  return { success: true, isGroup };
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { dishSchema, menuOfTheDaySchema } from "@/lib/validations";

type ActionResult =
  | { success: true; warning?: string }
  | { success: false; error: string };

async function assertAdmin(): Promise<void> {
  const userId = await getSessionUserId();
  if (!userId) throw new Error("Non autorisé");
}

// ─────────────────────── Plats (Carte) ───────────────────────

export async function upsertDish(formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const id = formData.get("id")?.toString() || null;
  const parsed = dishSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    category: formData.get("category"),
    isAvailable: formData.get("isAvailable") === "on",
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  if (id) {
    await prisma.dish.update({ where: { id }, data: parsed.data });
  } else {
    await prisma.dish.create({ data: parsed.data });
  }
  revalidatePath("/admin/menu");
  revalidatePath("/");
  return { success: true };
}

export async function deleteDish(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id")?.toString();
  if (!id) return;
  await prisma.dish.delete({ where: { id } });
  revalidatePath("/admin/menu");
  revalidatePath("/");
}

export async function toggleDishAvailability(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id")?.toString();
  if (!id) return;
  const dish = await prisma.dish.findUnique({ where: { id } });
  if (!dish) return;
  await prisma.dish.update({
    where: { id },
    data: { isAvailable: !dish.isAvailable },
  });
  revalidatePath("/admin/menu");
  revalidatePath("/");
}

// ─────────────────────── Menu du jour ───────────────────────

export async function upsertMenuOfTheDay(formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = menuOfTheDaySchema.safeParse({
    date: formData.get("date"),
    starterName: formData.get("starterName"),
    mainCourseName: formData.get("mainCourseName"),
    dessertName: formData.get("dessertName"),
    price: formData.get("price"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const date = new Date(parsed.data.date);
  date.setUTCHours(0, 0, 0, 0);

  await prisma.menuOfTheDay.upsert({
    where: { date },
    update: {
      starterName: parsed.data.starterName,
      mainCourseName: parsed.data.mainCourseName,
      dessertName: parsed.data.dessertName,
      price: parsed.data.price,
    },
    create: {
      date,
      starterName: parsed.data.starterName,
      mainCourseName: parsed.data.mainCourseName,
      dessertName: parsed.data.dessertName,
      price: parsed.data.price,
    },
  });
  revalidatePath("/admin/menu");
  revalidatePath("/");
  return { success: true };
}

// ─────────────────────── Réservations ───────────────────────

export async function createReservationAdmin(formData: FormData): Promise<ActionResult> {
  await assertAdmin();

  const firstName = formData.get("firstName")?.toString()?.trim();
  const customerName = formData.get("customerName")?.toString()?.trim();
  const email = formData.get("email")?.toString()?.trim() ?? "";
  const phone = formData.get("phone")?.toString()?.trim();
  const date = formData.get("date")?.toString();
  const slot = formData.get("slot")?.toString();
  const guestCountRaw = Number(formData.get("guestCount"));
  const spaceIdRaw = formData.get("spaceId")?.toString();
  const message = formData.get("message")?.toString()?.trim() ?? null;
  const statusRaw = formData.get("status")?.toString() ?? "CONFIRMED";

  if (!firstName || !customerName || !phone || !date || !slot) {
    return { success: false, error: "Champs obligatoires manquants." };
  }
  if (!["LUNCH", "DINNER"].includes(slot)) {
    return { success: false, error: "Créneau invalide." };
  }
  if (!["PENDING", "CONFIRMED", "CANCELLED"].includes(statusRaw)) {
    return { success: false, error: "Statut invalide." };
  }

  const reservationDate = new Date(date);
  if (Number.isNaN(reservationDate.getTime())) {
    return { success: false, error: "Date invalide." };
  }

  const guestCount = Number.isInteger(guestCountRaw) && guestCountRaw > 0 ? guestCountRaw : 1;

  let spaceId: string | null = null;
  if (spaceIdRaw && spaceIdRaw !== "any") {
    const space = await prisma.space.findUnique({ where: { id: spaceIdRaw } });
    if (!space) return { success: false, error: "Espace inconnu." };
    spaceId = space.id;
  }

  const isGroupExplicit = formData.get("isGroup")?.toString();
  const isGroup =
    isGroupExplicit === "1" ? true : isGroupExplicit === "0" ? false : guestCount >= 12;

  await prisma.reservation.create({
    data: {
      firstName,
      customerName,
      email,
      phone,
      date: reservationDate,
      slot: slot as "LUNCH" | "DINNER",
      guestCount,
      status: statusRaw as "PENDING" | "CONFIRMED" | "CANCELLED",
      isGroup,
      message: message || null,
      spaceId,
    },
  });

  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateReservationAdmin(formData: FormData): Promise<ActionResult> {
  await assertAdmin();

  const id = formData.get("id")?.toString();
  if (!id) return { success: false, error: "Identifiant manquant." };

  const firstName = formData.get("firstName")?.toString()?.trim();
  const customerName = formData.get("customerName")?.toString()?.trim();
  const email = formData.get("email")?.toString()?.trim() ?? "";
  const phone = formData.get("phone")?.toString()?.trim();
  const date = formData.get("date")?.toString();
  const slot = formData.get("slot")?.toString();
  const guestCountRaw = Number(formData.get("guestCount"));
  const spaceIdRaw = formData.get("spaceId")?.toString();
  const message = formData.get("message")?.toString()?.trim() ?? null;
  const statusRaw = formData.get("status")?.toString() ?? "CONFIRMED";

  if (!firstName || !customerName || !phone || !date || !slot) {
    return { success: false, error: "Champs obligatoires manquants." };
  }
  if (!["LUNCH", "DINNER"].includes(slot)) {
    return { success: false, error: "Créneau invalide." };
  }
  if (!["PENDING", "CONFIRMED", "CANCELLED"].includes(statusRaw)) {
    return { success: false, error: "Statut invalide." };
  }

  const reservationDate = new Date(date);
  if (Number.isNaN(reservationDate.getTime())) {
    return { success: false, error: "Date invalide." };
  }

  const guestCount = Number.isInteger(guestCountRaw) && guestCountRaw > 0 ? guestCountRaw : 1;
  const isGroup = guestCount >= 12;

  let spaceId: string | null = null;
  let spaceWarning: string | undefined;
  if (spaceIdRaw && spaceIdRaw !== "any") {
    const space = await prisma.space.findUnique({ where: { id: spaceIdRaw } });
    if (!space) return { success: false, error: "Espace inconnu." };
    spaceId = space.id;

    // Vérifier si cette salle est privatisée par un autre groupe confirmé sur le même créneau
    const conflict = await prisma.reservation.findFirst({
      where: {
        id: { not: id },
        spaceId,
        date: new Date(date),
        slot: slot as "LUNCH" | "DINNER",
        isGroup: true,
        status: "CONFIRMED",
      },
      select: { firstName: true, customerName: true },
    });
    if (conflict) {
      spaceWarning = `Attention : cette salle est déjà privatisée par le groupe ${conflict.firstName} ${conflict.customerName} sur ce créneau. La modification a été enregistrée, mais un conflit existe.`;
    }
  }

  await prisma.reservation.update({
    where: { id },
    data: {
      firstName,
      customerName,
      email,
      phone,
      date: reservationDate,
      slot: slot as "LUNCH" | "DINNER",
      guestCount,
      status: statusRaw as "PENDING" | "CONFIRMED" | "CANCELLED",
      isGroup,
      message: message || null,
      spaceId,
    },
  });

  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
  return { success: true, warning: spaceWarning };
}

export async function updateReservationStatus(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id")?.toString();
  const status = formData.get("status")?.toString();
  if (!id || !status || !["CONFIRMED", "CANCELLED", "PENDING"].includes(status)) return;

  await prisma.reservation.update({
    where: { id },
    data: { status: status as "CONFIRMED" | "CANCELLED" | "PENDING" },
  });
  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
}

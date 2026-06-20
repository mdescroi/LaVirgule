"use server";

import { revalidatePath } from "next/cache";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { dishSchema, menuOfTheDaySchema, siteSettingsSchema, dishSubCategorySchema, eventSchema } from "@/lib/validations";

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
  const subCategoryIdRaw = formData.get("subCategoryId")?.toString() || null;
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

  const data = { ...parsed.data, subCategoryId: subCategoryIdRaw || null };

  if (id) {
    await prisma.dish.update({ where: { id }, data });
  } else {
    await prisma.dish.create({ data });
  }
  revalidatePath("/admin/menu");
  revalidatePath("/carte");
  return { success: true };
}

export async function deleteDish(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id")?.toString();
  if (!id) return;
  await prisma.dish.delete({ where: { id } });
  revalidatePath("/admin/menu");
  revalidatePath("/carte");
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
  revalidatePath("/carte");
}

// ─────────────────────── Menu du jour ───────────────────────

export async function upsertMenuOfTheDay(formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = menuOfTheDaySchema.safeParse({
    date: formData.get("date"),
    starterName: formData.get("starterName"),
    mainCourseName: formData.get("mainCourseName"),
    dessertName: formData.get("dessertName"),
    priceStarterMain: formData.get("priceStarterMain"),
    priceFullMenu: formData.get("priceFullMenu"),
    priceMainDessert: formData.get("priceMainDessert"),
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
      priceStarterMain: parsed.data.priceStarterMain,
      priceFullMenu: parsed.data.priceFullMenu,
      priceMainDessert: parsed.data.priceMainDessert,
    },
    create: {
      date,
      starterName: parsed.data.starterName,
      mainCourseName: parsed.data.mainCourseName,
      dessertName: parsed.data.dessertName,
      priceStarterMain: parsed.data.priceStarterMain,
      priceFullMenu: parsed.data.priceFullMenu,
      priceMainDessert: parsed.data.priceMainDessert,
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

// ─────────────────────── Horaires (SiteSettings) ─────────────

export async function updateSiteSettings(formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const parsed = siteSettingsSchema.safeParse({
    hoursLine1: formData.get("hoursLine1"),
    hoursLine2: formData.get("hoursLine2") ?? "",
    hoursLine3: formData.get("hoursLine3") ?? "",
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });
  revalidatePath("/admin/horaires");
  revalidatePath("/");
  return { success: true };
}

// ─────────────────────── Sous-catégories de plats ────────────

export async function createDishSubCategory(formData: FormData): Promise<void> {
  await assertAdmin();
  const parsed = dishSubCategorySchema.safeParse({
    name: formData.get("name"),
    parentCategory: formData.get("parentCategory"),
  });
  if (!parsed.success) {
    return;
  }
  const maxOrder = await prisma.dishSubCategory.aggregate({
    where: { parentCategory: parsed.data.parentCategory },
    _max: { sortOrder: true },
  });
  await prisma.dishSubCategory.create({
    data: { ...parsed.data, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
  });
  revalidatePath("/admin/menu");
  revalidatePath("/carte");
}

export async function deleteDishSubCategory(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id")?.toString();
  if (!id) return;
  // Désassocier les plats avant suppression
  await prisma.dish.updateMany({ where: { subCategoryId: id }, data: { subCategoryId: null } });
  await prisma.dishSubCategory.delete({ where: { id } });
  revalidatePath("/admin/menu");
  revalidatePath("/carte");
}

// ─────────────────────── Événements ──────────────────────────

async function deleteLocalEventImage(imageUrl: string | null) {
  if (!imageUrl?.startsWith("/img/events/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", imageUrl));
  } catch {
    // Le fichier peut déjà être absent
  }
}

export async function upsertEvent(formData: FormData): Promise<ActionResult> {
  await assertAdmin();
  const id = formData.get("id")?.toString() || null;
  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    date: formData.get("date"),
    endDate: formData.get("endDate") || undefined,
    location: formData.get("location") || undefined,
    imageUrl: formData.get("imageUrl") || undefined,
    isPublished: formData.get("isPublished") === "on",
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const { date, endDate, imageUrl, location, ...rest } = parsed.data;
  const data = {
    ...rest,
    date: new Date(date),
    endDate: endDate ? new Date(endDate) : null,
    imageUrl: imageUrl || null,
    location: location || null,
  };
  if (id) {
    const existing = await prisma.event.findUnique({ where: { id }, select: { imageUrl: true } });
    await prisma.event.update({ where: { id }, data });
    if (existing?.imageUrl !== data.imageUrl) {
      await deleteLocalEventImage(existing?.imageUrl ?? null);
    }
  } else {
    await prisma.event.create({ data });
  }
  revalidatePath("/admin/evenements");
  revalidatePath("/evenements");
  return { success: true };
}

export async function deleteEvent(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id")?.toString();
  if (!id) return;
  const event = await prisma.event.findUnique({ where: { id }, select: { imageUrl: true } });
  await prisma.event.delete({ where: { id } });
  await deleteLocalEventImage(event?.imageUrl ?? null);
  revalidatePath("/admin/evenements");
  revalidatePath("/evenements");
}

export async function toggleEventPublished(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = formData.get("id")?.toString();
  if (!id) return;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return;
  await prisma.event.update({ where: { id }, data: { isPublished: !event.isPublished } });
  revalidatePath("/admin/evenements");
  revalidatePath("/evenements");
}

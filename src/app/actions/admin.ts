"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { dishSchema, menuOfTheDaySchema } from "@/lib/validations";

type ActionResult = { success: true } | { success: false; error: string };

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

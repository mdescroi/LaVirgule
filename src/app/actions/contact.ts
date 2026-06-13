"use server";

import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validations";

export type ContactResult =
  | { success: true }
  | { success: false; error: string };

export async function sendContactMessage(
  formData: FormData
): Promise<ContactResult> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  try {
    await prisma.contactMessage.create({ data: parsed.data });
  } catch {
    return { success: false, error: "Une erreur est survenue, veuillez réessayer." };
  }

  return { success: true };
}

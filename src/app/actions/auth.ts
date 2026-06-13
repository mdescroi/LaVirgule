"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export type LoginResult = { success: false; error: string };

export async function login(formData: FormData): Promise<LoginResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { success: false, error: "Identifiants invalides." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  // Comparaison systématique pour éviter les attaques temporelles / énumération
  const hash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalid12345678";
  const valid = await bcrypt.compare(parsed.data.password, hash);

  if (!user || !valid) {
    return { success: false, error: "Email ou mot de passe incorrect." };
  }

  await createSession(user.id);
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

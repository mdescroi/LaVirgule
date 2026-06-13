import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "lavirgule_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 8; // 8 heures

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET manquant dans .env");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${userId}.${expiresAt}`;
  const token = `${payload}.${sign(payload)}`;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.HTTPS_ENABLED === "true",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAtStr, signature] = parts;
  const payload = `${userId}.${expiresAtStr}`;
  const expected = sign(payload);

  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  if (Number(expiresAtStr) < Date.now()) return null;
  return userId;
}

/** À appeler dans les pages/layouts admin : redirige vers /admin/login si non connecté. */
export async function requireAdmin(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) redirect("/admin/login");
  return userId;
}

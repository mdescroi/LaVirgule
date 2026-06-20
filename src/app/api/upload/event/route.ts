import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getSessionUserId } from "@/lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
const UPLOAD_DIR = path.join(process.cwd(), "public", "img", "events");

export async function POST(req: NextRequest): Promise<NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Format non supporté. Acceptés : JPG, PNG, WEBP, GIF" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Fichier trop grand (max 5 Mo)" }, { status: 400 });
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const filename = `${randomUUID()}.${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  const bytes = await file.arrayBuffer();
  await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(bytes));

  return NextResponse.json({ path: `/img/events/${filename}` });
}

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getSessionUserId } from "@/lib/auth";
import { getEventUploadDir, EVENT_MEDIA_PREFIX, UPLOAD_EXT_BY_MIME } from "@/lib/uploads";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

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

  const ext = UPLOAD_EXT_BY_MIME[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Format non supporté. Acceptés : JPG, PNG, WEBP, GIF" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Fichier trop grand (max 5 Mo)" }, { status: 400 });
  }

  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = getEventUploadDir();

  try {
    await mkdir(uploadDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));
  } catch (err) {
    console.error("Échec de l'écriture de l'image d'événement :", err);
    return NextResponse.json(
      { error: "Impossible d'enregistrer l'image sur le serveur." },
      { status: 500 },
    );
  }

  // URL servie par la route Node (et non par le service statique de public/).
  return NextResponse.json({ path: `${EVENT_MEDIA_PREFIX}${filename}` });
}

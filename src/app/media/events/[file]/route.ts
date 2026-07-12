import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getEventUploadDir, isSafeUploadFilename, UPLOAD_MIME_BY_EXT } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> },
): Promise<NextResponse> {
  const { file } = await params;

  if (!isSafeUploadFilename(file)) {
    return NextResponse.json({ error: "Nom de fichier invalide" }, { status: 400 });
  }

  const ext = file.split(".").pop()?.toLowerCase() ?? "";
  const contentType = UPLOAD_MIME_BY_EXT[ext] ?? "application/octet-stream";

  let bytes: Buffer;
  try {
    bytes = await readFile(path.join(getEventUploadDir(), file));
  } catch {
    return NextResponse.json({ error: "Image introuvable" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // Le nom de fichier est un UUID unique → cache long et sûr.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

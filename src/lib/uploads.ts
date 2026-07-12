import path from "path";

/**
 * Répertoire PERSISTANT des images d'événements — délibérément HORS du dossier
 * de build (`public/`, `.next/`) pour survivre à `git pull` + `npm run build` +
 * redémarrage PM2, et pour ne pas avoir à committer les binaires dans git.
 *
 * En production (VPS), définir `EVENT_UPLOAD_DIR` sur un chemin ABSOLU stable,
 * par exemple : /var/lib/lavirgule/uploads/events
 * (à créer une fois : `mkdir -p /var/lib/lavirgule/uploads/events`).
 *
 * En local, valeur par défaut = `<projet>/uploads/events` (ignoré par git).
 */
export function getEventUploadDir(): string {
  const fromEnv = process.env.EVENT_UPLOAD_DIR?.trim();
  if (fromEnv) return fromEnv;
  return path.join(process.cwd(), "uploads", "events");
}

/** Préfixe d'URL public servi par la route `src/app/media/events/[file]/route.ts`. */
export const EVENT_MEDIA_PREFIX = "/media/events/";

/** Extensions autorisées ↔ types MIME. */
export const UPLOAD_EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const UPLOAD_MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * Valide qu'un nom de fichier est sûr à lire (anti path-traversal) : uniquement
 * un UUID + extension image, aucun séparateur de chemin ni `..`.
 */
export function isSafeUploadFilename(name: string): boolean {
  if (name.includes("/") || name.includes("\\") || name.includes("..")) return false;
  return /^[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp|gif)$/.test(name);
}

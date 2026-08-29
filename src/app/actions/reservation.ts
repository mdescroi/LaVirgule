"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { reservationSchema } from "@/lib/validations";
import { RESTAURANT, SERVICE_SLOTS, ONLINE_SERVICE_CAP, RESERVATION_WINDOW_DAYS } from "@/lib/config";
import { isServiceOpen, weekdayLabel } from "@/lib/opening-schedule";

export type ReservationResult =
  | { success: true; isGroup: boolean }
  | { success: false; error: string; code?: "SERVICE_FULL" };

/** Nombre maximum de couverts (tables classiques) acceptés par service. */
const SERVICE_CAP = ONLINE_SERVICE_CAP;

const SPACE_PREFERENCE_LABELS: Record<string, string> = {
  INDOOR: "Intérieur",
  OUTDOOR: "Extérieur",
  ANY: "Indifférent",
};

function slotLabel(slot: string): string {
  return SERVICE_SLOTS.find((s) => s.value === slot)?.label ?? slot;
}

function shortSlotLabel(slot: string): string {
  if (slot === "LUNCH") return "Midi";
  if (slot === "DINNER") return "Soir";
  return "Autre";
}

export async function createReservation(
  formData: FormData
): Promise<ReservationResult> {
  const raw = {
    firstName: formData.get("firstName"),
    customerName: formData.get("customerName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    date: formData.get("date"),
    slot: formData.get("slot"),
    guestCount: formData.get("guestCount"),
    spacePreference: formData.get("spacePreference") || undefined,
    message: formData.get("message") || undefined,
  };

  const parsed = reservationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  const data = parsed.data;
  const reservationDate = new Date(data.date);
  if (reservationDate < new Date(new Date().toDateString())) {
    return { success: false, error: "La date doit être dans le futur." };
  }

  // >= 12 personnes → demande de groupe (PENDING) traitée à la main + email.
  const isGroup = data.guestCount >= RESTAURANT.groupThreshold;

  // Bornes du jour pour le comptage / la sauvegarde.
  const dayStart = new Date(data.date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const nextDay = new Date(dayStart);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  // ── Réservation de table classique : fenêtre de réservation + jours/services fermés.
  // Les groupes (devis) restent toujours possibles, y compris hors planning ou au-delà de l'horizon.
  if (!isGroup) {
    const maxDate = new Date();
    maxDate.setUTCHours(0, 0, 0, 0);
    maxDate.setUTCDate(maxDate.getUTCDate() + RESERVATION_WINDOW_DAYS);
    if (dayStart > maxDate) {
      return {
        success: false,
        error: `Les réservations en ligne sont ouvertes jusqu'à ${RESERVATION_WINDOW_DAYS} jours à l'avance. Pour une date plus lointaine, appelez-nous au ${RESTAURANT.phone}.`,
      };
    }

    if (data.slot === "LUNCH" || data.slot === "DINNER") {
      const open = await isServiceOpen(dayStart, data.slot);
      if (!open) {
        return {
          success: false,
          error: `Nous sommes fermés le ${weekdayLabel(dayStart.getUTCDay())} ${data.slot === "LUNCH" ? "midi" : "soir"}. Merci de choisir une autre date ou de nous appeler au ${RESTAURANT.phone}.`,
        };
      }
    }
  }

  // ── Plafond : 20 couverts max par service, uniquement pour les tables classiques.
  // Les groupes (devis) ne sont pas comptés et jamais bloqués par ce plafond.
  if (!isGroup) {
    try {
      const existing = await prisma.reservation.findMany({
        where: {
          isGroup: false,
          slot: data.slot,
          status: { not: "CANCELLED" },
          date: { gte: dayStart, lt: nextDay },
        },
        select: { guestCount: true },
      });
      const alreadyBooked = existing.reduce((s, r) => s + r.guestCount, 0);
      const remaining = SERVICE_CAP - alreadyBooked;

      if (remaining <= 0) {
        return {
          success: false,
          code: "SERVICE_FULL",
          error: "Le quota de réservations en ligne est atteint pour ce service.",
        };
      }
      if (data.guestCount > remaining) {
        return {
          success: false,
          code: "SERVICE_FULL",
          error: `Il ne reste que ${remaining} place${remaining > 1 ? "s" : ""} réservable${remaining > 1 ? "s" : ""} en ligne sur ce service.`,
        };
      }
    } catch {
      return {
        success: false,
        error: "Une erreur est survenue. Veuillez nous appeler au " + RESTAURANT.phone,
      };
    }
  }

  try {
    await prisma.reservation.create({
      data: {
        firstName: data.firstName,
        customerName: data.customerName,
        email: data.email,
        phone: data.phone,
        date: reservationDate,
        slot: data.slot,
        guestCount: data.guestCount,
        status: isGroup ? "PENDING" : "CONFIRMED",
        isGroup,
        // La salle exacte n'est jamais choisie par le client : on stocke seulement son souhait.
        spacePreference: isGroup ? null : (data.spacePreference ?? "ANY"),
        message: data.message ?? null,
        spaceId: null,
      },
    });
  } catch {
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez nous appeler au " + RESTAURANT.phone,
    };
  }

  // ── Notifications (non bloquantes : la réservation est déjà enregistrée en base).
  if (isGroup) {
    // Groupe : alerte au restaurant (devis à traiter à la main).
    await notifyGroupReservation(data);
    // + accusé de réception au client (la confirmation définitive viendra après validation).
    await sendGroupAcknowledgmentEmail(data);
  } else {
    // Table confirmée : email de confirmation au client + notification au restaurant.
    await sendCustomerConfirmationEmail(data);
    await notifyNewTableReservation(data);
  }

  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
  return { success: true, isGroup };
}

// ─────────────────────────── Emails ───────────────────────────

type ReservationData = {
  firstName: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  slot: string;
  guestCount: number;
  spacePreference?: string;
  message?: string;
};

/** Crée un transporteur SMTP à partir du .env, ou null si la config est absente. */
function getTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodemailer = require("nodemailer") as typeof import("nodemailer");
  const smtpPort = Number(process.env.SMTP_PORT ?? 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465, // port 465 = SSL (Infomaniak & Gmail)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function formatDateLong(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Email de confirmation envoyé au client pour une réservation de table confirmée. */
async function sendCustomerConfirmationEmail(data: ReservationData): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[reservation] Email de confirmation non envoyé : configuration SMTP manquante.");
    return;
  }

  try {
    const dateLabel = formatDateLong(data.date);
    const prefLabel =
      data.spacePreference && data.spacePreference !== "ANY"
        ? SPACE_PREFERENCE_LABELS[data.spacePreference]
        : null;

    await transporter.sendMail({
      from: `"${RESTAURANT.name}" <${process.env.SMTP_USER}>`,
      to: data.email,
      replyTo: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
      subject: `Votre réservation à ${RESTAURANT.name} est confirmée`,
      text: [
        `Bonjour ${data.firstName},`,
        "",
        `Votre table est réservée. Voici le récapitulatif :`,
        "",
        `Date : ${dateLabel}`,
        `Service : ${slotLabel(data.slot)}`,
        `Nombre de couverts : ${data.guestCount}`,
        prefLabel ? `Espace souhaité : ${prefLabel}` : "",
        "",
        `Adresse : ${RESTAURANT.fullAddress}`,
        `Téléphone : ${RESTAURANT.phone}`,
        "",
        `Pour modifier ou annuler votre réservation, appelez-nous au ${RESTAURANT.phone}.`,
        "",
        `À très bientôt,`,
        `L'équipe de ${RESTAURANT.name}`,
      ]
        .filter(Boolean)
        .join("\n"),
      html: `
        <table style="font-family:sans-serif;font-size:15px;color:#1c1917;max-width:600px">
          <tr><td style="padding:24px 0 0">
            <h2 style="margin:0 0 8px;color:#059669">Réservation confirmée ✓</h2>
            <p>Bonjour <strong>${data.firstName}</strong>,</p>
            <p>Votre table est réservée. Nous nous réjouissons de vous accueillir !</p>
            <table style="margin:16px 0;border-collapse:collapse">
              <tr><td style="padding:4px 12px 4px 0;color:#78716c">Date</td><td style="padding:4px 0"><strong>${dateLabel}</strong></td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#78716c">Service</td><td style="padding:4px 0"><strong>${slotLabel(data.slot)}</strong></td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#78716c">Couverts</td><td style="padding:4px 0"><strong>${data.guestCount} personne${data.guestCount > 1 ? "s" : ""}</strong></td></tr>
              ${prefLabel ? `<tr><td style="padding:4px 12px 4px 0;color:#78716c">Espace souhaité</td><td style="padding:4px 0"><strong>${prefLabel}</strong></td></tr>` : ""}
            </table>
            <hr style="border:none;border-top:1px solid #e7e5e4;margin:16px 0"/>
            <p style="margin:4px 0"><strong>${RESTAURANT.name}</strong><br/>${RESTAURANT.fullAddress}</p>
            <p style="margin:4px 0">Pour modifier ou annuler, appelez-nous au <a href="${RESTAURANT.phoneHref}" style="color:#d97706;font-weight:600">${RESTAURANT.phone}</a>.</p>
            <p style="color:#78716c;font-size:13px;margin-top:16px">À très bientôt - l'équipe de ${RESTAURANT.name}.</p>
          </td></tr>
        </table>`,
    });
  } catch (err) {
    console.error("[reservation] Erreur envoi email confirmation client :", err);
  }
}

/** Notification envoyée au restaurant pour chaque nouvelle réservation de table classique (auto-confirmée). */
async function notifyNewTableReservation(data: ReservationData): Promise<void> {
  const contactEmail = process.env.CONTACT_EMAIL;
  const transporter = getTransporter();
  if (!contactEmail || !transporter) {
    console.warn("[reservation] Notification nouvelle réservation non envoyée : configuration SMTP manquante.");
    return;
  }

  try {
    const dateLabel = formatDateLong(data.date);
    const prefLabel = SPACE_PREFERENCE_LABELS[data.spacePreference ?? "ANY"] ?? "Indifférent";
    const safeMessage = (data.message ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    await transporter.sendMail({
      from: `"La Virgule - Nouveau site" <${process.env.SMTP_USER}>`,
      to: contactEmail,
      replyTo: `"${data.firstName} ${data.customerName}" <${data.email}>`,
      subject: `[Nouveau site de Max] Réservation ${data.firstName} ${data.customerName} - ${dateLabel} - ${shortSlotLabel(data.slot)} - ${data.guestCount} pers. - ${prefLabel}`,
      text: [
        `Nouvelle réservation de table (notification envoyée par le nouveau site de Max).`,
        "",
        `Nom : ${data.firstName} ${data.customerName}`,
        `Email : ${data.email}`,
        `Téléphone : ${data.phone}`,
        `Date : ${dateLabel}`,
        `Service : ${slotLabel(data.slot)}`,
        `Couverts : ${data.guestCount}`,
        `Espace souhaité : ${prefLabel}`,
        data.message ? `\nMessage :\n${data.message}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      html: `
        <table style="font-family:sans-serif;font-size:15px;color:#1c1917;max-width:600px">
          <tr><td style="padding:24px 0 0">
            <h2 style="margin:0 0 16px;color:#059669">Nouvelle réservation - La Virgule</h2>
            <p><strong>Nom :</strong> ${data.firstName} ${data.customerName}</p>
            <p><strong>Email :</strong> <a href="mailto:${data.email}">${data.email}</a></p>
            <p><strong>Téléphone :</strong> ${data.phone}</p>
            <p><strong>Date :</strong> ${dateLabel}</p>
            <p><strong>Service :</strong> ${slotLabel(data.slot)}</p>
            <p><strong>Couverts :</strong> ${data.guestCount} personne${data.guestCount > 1 ? "s" : ""}</p>
            <p><strong>Espace souhaité :</strong> ${prefLabel}</p>
            ${safeMessage ? `<p style="white-space:pre-wrap"><strong>Message :</strong> ${safeMessage}</p>` : ""}
            <hr style="border:none;border-top:1px solid #e7e5e4;margin:16px 0"/>
            <p style="color:#78716c;font-size:13px">Notification envoyée automatiquement par le nouveau site de Max.</p>
          </td></tr>
        </table>`,
    });
  } catch (err) {
    console.error("[reservation] Erreur envoi notification nouvelle réservation :", err);
  }
}

/** Accusé de réception envoyé au client qui vient de soumettre une demande de groupe. */
async function sendGroupAcknowledgmentEmail(data: ReservationData): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[reservation] Accusé de réception groupe non envoyé : configuration SMTP manquante.");
    return;
  }

  try {
    const dateLabel = formatDateLong(data.date);

    await transporter.sendMail({
      from: `"${RESTAURANT.name}" <${process.env.SMTP_USER}>`,
      to: data.email,
      replyTo: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
      subject: `Nous avons bien reçu votre demande de groupe - ${RESTAURANT.name}`,
      text: [
        `Bonjour ${data.firstName},`,
        "",
        `Nous avons bien reçu votre demande de réservation de groupe. Merci !`,
        "",
        `Récapitulatif de votre demande :`,
        `Date souhaitée : ${dateLabel}`,
        `Service : ${slotLabel(data.slot)}`,
        `Nombre de personnes : ${data.guestCount}`,
        "",
        `Notre équipe va l'étudier et vous recontacter rapidement pour établir le devis et confirmer l'organisation. À ce stade, aucune salle n'est encore réservée : tout se confirme après notre échange.`,
        "",
        `Pour toute question, appelez-nous au ${RESTAURANT.phone}.`,
        "",
        `À très bientôt,`,
        `L'équipe de ${RESTAURANT.name}`,
      ].join("\n"),
      html: `
        <table style="font-family:sans-serif;font-size:15px;color:#1c1917;max-width:600px">
          <tr><td style="padding:24px 0 0">
            <h2 style="margin:0 0 8px;color:#d97706">Demande de groupe bien reçue</h2>
            <p>Bonjour <strong>${data.firstName}</strong>,</p>
            <p>Nous avons bien reçu votre demande de réservation de groupe. Merci&nbsp;!</p>
            <table style="margin:16px 0;border-collapse:collapse">
              <tr><td style="padding:4px 12px 4px 0;color:#78716c">Date souhaitée</td><td style="padding:4px 0"><strong>${dateLabel}</strong></td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#78716c">Service</td><td style="padding:4px 0"><strong>${slotLabel(data.slot)}</strong></td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#78716c">Personnes</td><td style="padding:4px 0"><strong>${data.guestCount}</strong></td></tr>
            </table>
            <p>Notre équipe va l'étudier et vous recontacter rapidement pour établir le devis et confirmer l'organisation. À ce stade, <strong>aucune salle n'est encore réservée</strong>&nbsp;: tout se confirme après notre échange.</p>
            <hr style="border:none;border-top:1px solid #e7e5e4;margin:16px 0"/>
            <p style="margin:4px 0">Une question&nbsp;? Appelez-nous au <a href="${RESTAURANT.phoneHref}" style="color:#d97706;font-weight:600">${RESTAURANT.phone}</a>.</p>
            <p style="color:#78716c;font-size:13px;margin-top:16px">À très bientôt - l'équipe de ${RESTAURANT.name}.</p>
          </td></tr>
        </table>`,
    });
  } catch (err) {
    console.error("[reservation] Erreur envoi accusé de réception groupe :", err);
  }
}

export type ConfirmGroupResult =
  | { success: true; message?: string; warning?: string }
  | { success: false; error: string };

/**
 * Validation d'une réservation de groupe par l'admin.
 * Deux modes (champ `mode` du formulaire) :
 *   - "silent" : met simplement le statut à CONFIRMED en base, sans email.
 *   - "email"  : met à CONFIRMED ET envoie au client l'email rédigé par l'opérateur.
 * Le passage à CONFIRMED est toujours effectif ; un souci d'email devient un avertissement.
 */
export async function confirmGroupReservation(
  formData: FormData
): Promise<ConfirmGroupResult> {
  const userId = await getSessionUserId();
  if (!userId) return { success: false, error: "Non autorisé." };

  const id = formData.get("id")?.toString();
  if (!id) return { success: false, error: "Identifiant manquant." };

  const mode = formData.get("mode")?.toString() === "silent" ? "silent" : "email";

  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) return { success: false, error: "Réservation introuvable." };

  // Passage à CONFIRMED dans tous les cas.
  await prisma.reservation.update({
    where: { id },
    data: { status: "CONFIRMED" },
  });
  revalidatePath("/admin/reservations");
  revalidatePath("/admin");

  // Mode silencieux : on s'arrête là (mise à jour BDD uniquement).
  if (mode === "silent") {
    return { success: true, message: "Réservation confirmée (sans email)." };
  }

  // Mode email : on tente l'envoi, sans jamais annuler la confirmation déjà faite.
  const subject = formData.get("subject")?.toString()?.trim();
  const body = formData.get("body")?.toString();

  if (!subject || !body || !body.trim()) {
    return {
      success: true,
      warning: "Réservation confirmée, mais l'email n'a pas été envoyé (objet ou corps vide).",
    };
  }
  if (!reservation.email) {
    return {
      success: true,
      warning: "Réservation confirmée, mais aucun email client - confirmation non envoyée.",
    };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return {
      success: true,
      warning: "Réservation confirmée, mais l'email n'a pas été envoyé (configuration SMTP manquante).",
    };
  }

  try {
    const safeBody = body.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    await transporter.sendMail({
      from: `"${RESTAURANT.name}" <${process.env.SMTP_USER}>`,
      to: reservation.email,
      replyTo: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
      subject,
      text: body,
      html: `
        <table style="font-family:sans-serif;font-size:15px;color:#1c1917;max-width:600px">
          <tr><td style="padding:24px 0 0">
            <h2 style="margin:0 0 12px;color:#059669">Réservation de groupe confirmée ✓</h2>
            <div style="white-space:pre-wrap">${safeBody}</div>
            <hr style="border:none;border-top:1px solid #e7e5e4;margin:16px 0"/>
            <p style="color:#78716c;font-size:13px;margin:0">${RESTAURANT.name} - ${RESTAURANT.fullAddress} - ${RESTAURANT.phone}</p>
          </td></tr>
        </table>`,
    });
  } catch (err) {
    console.error("[reservation] Erreur envoi email confirmation groupe :", err);
    return {
      success: true,
      warning: "Réservation confirmée, mais l'envoi de l'email de confirmation a échoué.",
    };
  }

  return { success: true, message: "Réservation confirmée et email envoyé." };
}

/** Alerte email envoyée au restaurant pour une demande de réservation de groupe. */
async function notifyGroupReservation(data: ReservationData): Promise<void> {
  const contactEmail = process.env.CONTACT_EMAIL;
  const transporter = getTransporter();
  if (!contactEmail || !transporter) {
    console.warn("[reservation] Email groupe non envoyé : configuration SMTP manquante.");
    return;
  }

  try {
    const dateLabel = formatDateLong(data.date);
    const safeMessage = (data.message ?? "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    await transporter.sendMail({
      from: `"La Virgule - Réservation groupe" <${process.env.SMTP_USER}>`,
      to: contactEmail,
      replyTo: `"${data.firstName} ${data.customerName}" <${data.email}>`,
      subject: `[Réservation Groupe] ${data.guestCount} pers. - ${dateLabel}`,
      text: [
        `Nouvelle demande de réservation de groupe (${data.guestCount} personnes).`,
        "",
        `Nom : ${data.firstName} ${data.customerName}`,
        `Email : ${data.email}`,
        `Téléphone : ${data.phone}`,
        `Date : ${dateLabel}`,
        `Service : ${slotLabel(data.slot)}`,
        `Couverts : ${data.guestCount}`,
        data.message ? `\nMessage :\n${data.message}` : "",
        "",
        "Cette demande est enregistrée en statut « En attente » dans l'admin.",
      ]
        .filter(Boolean)
        .join("\n"),
      html: `
        <table style="font-family:sans-serif;font-size:15px;color:#1c1917;max-width:600px">
          <tr><td style="padding:24px 0 0">
            <h2 style="margin:0 0 16px;color:#d97706">Nouvelle réservation de groupe - La Virgule</h2>
            <p><strong>Nom :</strong> ${data.firstName} ${data.customerName}</p>
            <p><strong>Email :</strong> <a href="mailto:${data.email}">${data.email}</a></p>
            <p><strong>Téléphone :</strong> ${data.phone}</p>
            <p><strong>Date :</strong> ${dateLabel}</p>
            <p><strong>Service :</strong> ${slotLabel(data.slot)}</p>
            <p><strong>Couverts :</strong> ${data.guestCount} personnes</p>
            ${
              data.spacePreference
                ? `<p><strong>Préférence d'espace :</strong> ${SPACE_PREFERENCE_LABELS[data.spacePreference] ?? data.spacePreference}</p>`
                : ""
            }
            <hr style="border:none;border-top:1px solid #e7e5e4;margin:16px 0"/>
            ${
              safeMessage
                ? `<p style="white-space:pre-wrap"><strong>Message :</strong> ${safeMessage}</p>`
                : ""
            }
            <p style="color:#78716c;font-size:13px">Cette demande est enregistrée en statut « En attente » dans l'admin. Elle est à confirmer après devis.</p>
          </td></tr>
        </table>`,
    });
  } catch (err) {
    console.error("[reservation] Erreur envoi email groupe :", err);
  }
}

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

  const { name, email, phone, subject, message } = parsed.data;

  // 1. Sauvegarde en base (non bloquante)
  try {
    await prisma.contactMessage.create({ data: parsed.data });
  } catch {
    // On continue même si BDD échoue
  }

  // 2. Envoi email
  const contactEmail = process.env.CONTACT_EMAIL;
  if (!contactEmail || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { success: false, error: "Configuration email manquante sur le serveur." };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodemailer = require("nodemailer") as typeof import("nodemailer");
    
    const smtpPort = Number(process.env.SMTP_PORT ?? 465);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465, // Sera "true" grâce au port 465 d'Infomaniak
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"La Virgule - Formulaire" <${process.env.SMTP_USER}>`,
      to: contactEmail,
      replyTo: `"${name}" <${email}>`,
      subject: `[Contact] ${subject}`,
      text: [
        `Nom : ${name}`,
        `Email : ${email}`,
        phone ? `Téléphone : ${phone}` : "",
        `Sujet : ${subject}`,
        "",
        message,
      ]
        .filter(Boolean)
        .join("\n"),
      html: `
        <table style="font-family:sans-serif;font-size:15px;color:#1c1917;max-width:600px">
          <tr><td style="padding:24px 0 0">
            <h2 style="margin:0 0 16px;color:#d97706">Nouveau message - La Virgule</h2>
            <p><strong>Nom :</strong> ${name}</p>
            <p><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
            ${phone ? `<p><strong>Téléphone :</strong> ${phone}</p>` : ""}
            <p><strong>Sujet :</strong> ${subject}</p>
            <hr style="border:none;border-top:1px solid #e7e5e4;margin:16px 0"/>
            <p style="white-space:pre-wrap"><strong>Message :</strong> ${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            <p><strong>Mail envoyé depuis le formulaire du site <a href="https://restaurantlavirgulechauray.fr/">https://restaurantlavirgulechauray.fr/</a></strong></p>
          </td></tr>
        </table>`,
    });
  } catch (err) {
    console.error("[contact] Erreur envoi email :", err);
    return {
      success: false,
      error: "L'envoi du message a échoué. Veuillez réessayer ou nous appeler directement.",
    };
  }

  return { success: true };
}

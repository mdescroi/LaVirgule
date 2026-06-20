import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { ContactForm } from "@/components/site/contact-form";
import { Reveal } from "@/components/site/reveal";
import { RESTAURANT } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contact & Accès",
  description: `Contactez le restaurant La Virgule : ${RESTAURANT.fullAddress} — ${RESTAURANT.phone} — ${RESTAURANT.email}`,
};

export default async function ContactPage() {
  const siteSettings = await prisma.siteSettings
    .findUnique({ where: { id: "singleton" } })
    .catch(() => null);

  const hoursLines = [
    siteSettings?.hoursLine1 ?? RESTAURANT.hours.janToAug,
    siteSettings?.hoursLine2 ?? RESTAURANT.hours.janToAugGroups,
    siteSettings?.hoursLine3 ?? RESTAURANT.hours.sepToDec,
  ].filter(Boolean);
  return (
    <div className="bg-stone-50">
      {/* Bandeau */}
      <div className="bg-stone-950 pb-16 pt-32 text-center text-white">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-400">
          Nous écrire, nous trouver
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">Contact</h1>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-5">
          {/* Coordonnées */}
          <Reveal className="lg:col-span-2">
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Le restaurant
            </h2>
            <p className="mt-4 leading-relaxed text-stone-600">
              Le restaurant « La Virgule » vous accueille au {RESTAURANT.address} à{" "}
              {RESTAURANT.city}. Pour vos demandes d&apos;information ou de
              réservation, envoyez-nous un email ou remplissez le formulaire
              ci-contre.
            </p>

            <ul className="mt-8 space-y-5">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium text-stone-900">Adresse</p>
                  <address className="not-italic text-stone-600">
                    {RESTAURANT.address}
                    <br />
                    {RESTAURANT.city} ({RESTAURANT.zip})
                  </address>
                  <a
                    href={RESTAURANT.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm font-medium text-amber-700 hover:underline"
                  >
                    Voir le plan d&apos;accès →
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium text-stone-900">Téléphone</p>
                  <a
                    href={RESTAURANT.phoneHref}
                    className="text-stone-600 hover:text-amber-700"
                  >
                    {RESTAURANT.phone}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 size-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium text-stone-900">Email</p>
                  <a
                    href={RESTAURANT.emailHref}
                    className="text-stone-600 hover:text-amber-700"
                  >
                    {RESTAURANT.email}
                  </a>
                </div>
              </li>
            </ul>

            {/* Horaires */}
            <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="flex items-center gap-2 font-serif text-xl font-bold text-stone-900">
                <Clock className="size-5 text-amber-600" /> Horaires
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-stone-700">
                {hoursLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Formulaire */}
          <Reveal delay={0.15} className="lg:col-span-3">
            <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
              <h2 className="font-serif text-2xl font-bold text-stone-900">
                Envoyez-nous un message
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                Les champs marqués d&apos;un * sont obligatoires.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

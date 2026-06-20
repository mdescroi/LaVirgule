import type { Metadata } from "next";
import { Phone, Users, Briefcase, Clock, MapPin } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { RESTAURANT } from "@/lib/config";

export const metadata: Metadata = {
  title: "Réservation — La Virgule",
  description:
    "Pour réserver votre table ou organiser un événement au restaurant La Virgule à Chauray (Niort), appelez-nous directement au 05 49 33 13 70.",
};

export default function ReservationPage() {
  return (
    <div className="bg-stone-50">
      {/* Hero bandeau */}
      <div className="bg-stone-950 pb-20 pt-32 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-amber-400">
            La Virgule — Chauray · Niort
          </p>
          <h1 className="mt-4 font-serif text-4xl font-bold sm:text-5xl">
            Réservation
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-stone-300">
            Un coup de fil suffit. Notre équipe vous accueille et prend en
            charge votre réservation, quelle que soit la taille de votre groupe.
          </p>

          {/* CTA téléphone principal */}
          <div className="mt-10">
            <a
              href={RESTAURANT.phoneHref}
              className="inline-flex items-center gap-3 rounded-2xl bg-amber-500 px-8 py-5 text-xl font-bold text-stone-950 shadow-lg transition-colors hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <Phone className="size-6" />
              {RESTAURANT.phone}
            </a>
            <p className="mt-4 text-sm text-stone-400">
              Du lundi au vendredi · 12h–14h &amp; 19h–21h30 (sept. à déc.)
            </p>
          </div>
        </div>
      </div>

      {/* Cards table & groupe */}
      <div className="mx-auto -mt-8 max-w-2xl px-4 sm:px-6">
        <Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <Users className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-stone-900">Table classique</p>
                <p className="mt-1 text-sm leading-relaxed text-stone-500">
                  Pour un déjeuner ou un dîner en famille, entre amis ou
                  entre collègues — appelez-nous et nous trouverons le créneau
                  idéal pour vous.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <Briefcase className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-stone-900">Groupe &amp; Événement</p>
                <p className="mt-1 text-sm leading-relaxed text-stone-500">
                  Séminaires, repas d&apos;affaires, anniversaires, privatisations —
                  un seul appel pour organiser votre événement sur mesure.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Informations pratiques */}
      <div className="mx-auto mt-16 max-w-3xl px-4 pb-20 sm:px-6">
        <Reveal className="text-center">
          <h2 className="font-serif text-2xl font-bold text-stone-900 sm:text-3xl">
            Informations pratiques
          </h2>
        </Reveal>

        <Reveal delay={0.1} className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-stone-900">
              <Clock className="size-4 text-amber-500" /> Horaires
            </div>
            <ul className="mt-3 space-y-2 text-sm text-stone-600">
              <li>{RESTAURANT.hours.janToAug}</li>
              <li>{RESTAURANT.hours.janToAugGroups}</li>
              <li>{RESTAURANT.hours.sepToDec}</li>
            </ul>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-stone-900">
              <MapPin className="size-4 text-amber-500" /> Nous trouver
            </div>
            <address className="mt-3 text-sm not-italic leading-relaxed text-stone-600">
              {RESTAURANT.address}
              <br />
              {RESTAURANT.city} ({RESTAURANT.zip})
            </address>
            <a
              href={RESTAURANT.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-medium text-amber-600 hover:underline"
            >
              Voir sur Google Maps →
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.2} className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-sm font-medium text-stone-700">
            Vous pouvez aussi nous écrire à{" "}
            <a
              href={RESTAURANT.emailHref}
              className="font-semibold text-amber-700 hover:underline"
            >
              {RESTAURANT.email}
            </a>
            {" "}— nous vous répondrons dans les meilleurs délais.
          </p>
        </Reveal>
      </div>
    </div>
  );
}

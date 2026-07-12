import type { Metadata } from "next";
import { Phone, Clock, MapPin } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { ReservationForm } from "@/components/site/reservation-form";
import { RESTAURANT } from "@/lib/config";

export const metadata: Metadata = {
  title: "Réservation — La Virgule",
  description:
    "Réservez votre table en ligne au restaurant La Virgule à Chauray (Niort), ou organisez votre repas de groupe. Vous pouvez aussi nous appeler au 05 49 33 13 70.",
};

export default function ReservationPage() {
  return (
    <div className="bg-stone-50">
      {/* Hero bandeau */}
      <div className="bg-stone-950 pb-24 pt-32 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-amber-400">
            La Virgule — Chauray · Niort
          </p>
          <h1 className="mt-4 font-serif text-4xl font-bold sm:text-5xl">
            Réserver une table
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-stone-300">
            Réservez en quelques secondes ci-dessous, ou organisez votre repas
            de groupe. Une préférence, une question ? Appelez-nous.
          </p>

          {/* CTA téléphone secondaire */}
          <div className="mt-8">
            <a
              href={RESTAURANT.phoneHref}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Phone className="size-5 text-amber-400" />
              {RESTAURANT.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Formulaire de réservation */}
      <div className="mx-auto -mt-12 max-w-2xl px-4 sm:px-6">
        <Reveal>
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-lg sm:p-8">
            <ReservationForm />
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

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Briefcase, CalendarCheck, ChevronRight, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ReservationForm } from "@/components/site/reservation-form";
import { Reveal } from "@/components/site/reveal";
import { RESTAURANT } from "@/lib/config";

export const metadata: Metadata = {
  title: "Réserver une table",
  description:
    "Réservez votre table au restaurant La Virgule à Chauray (Niort) : réservation en ligne immédiate, devis groupes et privatisation pour entreprises.",
};

export const dynamic = "force-dynamic";

export default async function ReservationPage({
  searchParams,
}: {
  searchParams: Promise<{ groupe?: string }>;
}) {
  const params = await searchParams;
  const initialMode: "table" | "group" =
    params.groupe === "1" ? "group" : "table";

  const spaces = await prisma.space
    .findMany({ orderBy: { name: "asc" } })
    .catch(() => []);

  return (
    <div className="bg-stone-50">
      {/* Bandeau hero */}
      <div className="bg-stone-950 pb-16 pt-32 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-400">
            La Virgule — Chauray · Niort
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">
            Réservation
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-stone-400">
            Réservation en ligne instantanée pour les tables jusqu&apos;à{" "}
            {RESTAURANT.groupThreshold - 1} personnes. Pour un groupe ou un
            événement d&apos;entreprise, utilisez le formulaire dédié — notre
            équipe vous recontacte sous 24h.
          </p>
        </div>

        {/* Deux cards d'info en bas du bandeau */}
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:px-6">
          <div className="flex items-start gap-3 rounded-xl border border-stone-800 bg-stone-900 p-4">
            <Users className="mt-0.5 size-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-white">Table classique</p>
              <p className="mt-0.5 text-sm text-stone-400">
                Jusqu&apos;à {RESTAURANT.groupThreshold - 1} personnes —
                confirmation immédiate, choix de la salle possible.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-stone-800 bg-stone-900 p-4">
            <Briefcase className="mt-0.5 size-5 shrink-0 text-amber-400" />
            <div>
              <p className="font-semibold text-white">Groupe / Événement</p>
              <p className="mt-0.5 text-sm text-stone-400">
                À partir de {RESTAURANT.groupThreshold} personnes — devis sur
                mesure, privatisation confirmée après contact.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
            <Suspense fallback={null}>
              <ReservationForm
                initialMode={initialMode}
                spaces={spaces.map((s) => ({
                  id: s.id,
                  name: s.name,
                  capacity: s.capacity,
                  isOutdoor: s.isOutdoor,
                }))}
                blockedSpaceIds={[]}
              />
            </Suspense>
          </div>
        </Reveal>

        <p className="mt-8 text-center text-sm text-stone-500">
          Vous préférez le téléphone ? Appelez-nous au{" "}
          <a
            href={RESTAURANT.phoneHref}
            className="font-medium text-amber-700 hover:underline"
          >
            {RESTAURANT.phone}
          </a>
        </p>
      </div>

      {/* Section B2B détaillée */}
      <div className="border-t border-stone-200 bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-600">
              Entreprises · Associations · Groupes
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-stone-900 sm:text-4xl">
              Organiser un événement à La Virgule
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-stone-600">
              De la réunion d&apos;équipe au séminaire de deux jours, La Virgule
              met à disposition ses quatre espaces pour vos événements
              professionnels et privés, avec un suivi personnalisé.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "Vous envoyez votre demande",
                description:
                  "Remplissez le formulaire « Groupe / Événement » avec vos informations, la date, le nombre de participants et vos besoins.",
                step: "01",
              },
              {
                title: "Nous établissons votre devis",
                description:
                  "Notre équipe vous rappelle sous 24h pour affiner le menu, discuter de l'organisation et vous envoyer un devis détaillé.",
                step: "02",
              },
              {
                title: "Votre salle est privatisée",
                description:
                  "Après validation mutuelle, la salle de votre choix est bloquée pour votre groupe — aucune autre réservation n'y est acceptée.",
                step: "03",
              },
            ].map((item) => (
              <Reveal key={item.step}>
                <div className="relative rounded-xl border border-stone-200 bg-stone-50 p-6">
                  <span className="absolute -top-3 left-5 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-stone-950">
                    {item.step}
                  </span>
                  <h3 className="mt-2 font-semibold text-stone-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2} className="mt-10 text-center">
            <p className="text-stone-600">
              Besoin d&apos;une réponse rapide ? Contactez-nous directement au{" "}
              <a
                href={RESTAURANT.phoneHref}
                className="font-medium text-amber-700 hover:underline"
              >
                {RESTAURANT.phone}
              </a>{" "}
              ou par{" "}
              <a
                href={RESTAURANT.emailHref}
                className="font-medium text-amber-700 hover:underline"
              >
                email
              </a>
              .
            </p>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

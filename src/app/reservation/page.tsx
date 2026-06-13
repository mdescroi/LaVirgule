import type { Metadata } from "next";
import { Suspense } from "react";
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

export default async function ReservationPage() {
  const spaces = await prisma.space
    .findMany({ orderBy: { name: "asc" } })
    .catch(() => []);

  return (
    <div className="bg-stone-50">
      <div className="bg-stone-950 pb-16 pt-32 text-center text-white">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-400">
          Tables individuelles & groupes
        </p>
        <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">
          Réserver
        </h1>
        <p className="mx-auto mt-5 max-w-xl px-4 text-stone-400">
          Réservation immédiate jusqu&apos;à 11 personnes. À partir de 12
          personnes, nous étudions votre demande de privatisation et revenons
          vers vous avec un devis.
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm sm:p-10">
            <Suspense fallback={null}>
              <ReservationForm
                spaces={spaces.map((s) => ({
                  id: s.id,
                  name: s.name,
                  capacity: s.capacity,
                  isOutdoor: s.isOutdoor,
                }))}
              />
            </Suspense>
          </div>
        </Reveal>

        <p className="mt-8 text-center text-sm text-stone-500">
          Vous préférez le téléphone ? Appelez-nous au{" "}
          <a href={RESTAURANT.phoneHref} className="font-medium text-amber-700 hover:underline">
            {RESTAURANT.phone}
          </a>
          .
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/site/reveal";
import { HoursSection } from "@/components/site/hours-section";

export const revalidate = 300; // ISR : revalide toutes les 5 minutes

export const metadata: Metadata = {
  title: "Horaires & Accès",
  description:
    "Découvrez les horaires d'ouverture et l'adresse d'accès du restaurant La Virgule à Chauray / Niort.",
};

const DEFAULT_HOURS = {
  hoursLine1: "Service du midi de 12h à 14h.",
  hoursLine2: "Service du soir de 19h à 21h",
  hoursLine3: "Du Lundi au Vendredi",
};

export default async function HorairesPage() {
  const siteSettings = await prisma.siteSettings
    .findUnique({ where: { id: "singleton" } })
    .catch(() => null);

  const hours = siteSettings ?? DEFAULT_HOURS;

  return (
    <main className="min-h-screen bg-stone-950">
      {/* Hero */}
      <div className="bg-stone-950 pb-16 pt-32 text-center text-white">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-amber-400">
            Venir chez nous
          </p>
          <h1 className="mt-4 font-serif text-5xl font-bold text-white sm:text-6xl">
            Horaires &amp; Accès
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-stone-400">
            Retrouvez toutes les informations pour venir déguster nos plats au restaurant La Virgule.
          </p>
        </Reveal>
      </div>

      <div className="border-t border-stone-900">
        <HoursSection
          hoursLine1={hours.hoursLine1}
          hoursLine2={hours.hoursLine2}
          hoursLine3={hours.hoursLine3}
        />
      </div>
    </main>
  );
}

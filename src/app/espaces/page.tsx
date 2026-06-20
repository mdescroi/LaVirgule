import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/site/reveal";
import { SpacesCarousel } from "@/components/site/spaces-carousel";

export const revalidate = 300; // ISR : revalide toutes les 5 minutes

export const metadata: Metadata = {
  title: "Nos Espaces",
  description:
    "Découvrez les espaces du restaurant La Virgule : quatre salles intérieures et une terrasse extérieure pour tous vos moments.",
};

export default async function EspacesPage() {
  const spaces = await prisma.space
    .findMany({ orderBy: { sortOrder: "asc" } })
    .catch(() => []);

  return (
    <main className="min-h-screen bg-stone-950">
      {/* Hero */}
      <div className="bg-stone-950 pb-16 pt-32 text-center text-white">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-amber-400">
            Cadre & Atmosphères
          </p>
          <h1 className="mt-4 font-serif text-5xl font-bold text-white sm:text-6xl">
            Nos Espaces
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-stone-400">
            Quatre salles intérieures et une terrasse extérieure : pour vos déjeuners, dîners, séminaires ou événements privés.
          </p>
        </Reveal>
      </div>

      <div className="border-t border-stone-900">
        <SpacesCarousel spaces={spaces.map((s) => ({
          id: s.id,
          name: s.name,
          capacity: s.capacity,
          isOutdoor: s.isOutdoor,
          description: s.description,
          imageUrl: s.imageUrl,
        }))} />
      </div>
    </main>
  );
}

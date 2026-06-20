"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Phone, Sun, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";
import { RESTAURANT } from "@/lib/config";

export type SpaceSlide = {
  id: string;
  name: string;
  capacity: number;
  isOutdoor: boolean;
  description: string | null;
  imageUrl: string | null;
};

const FALLBACK_SLIDES: SpaceSlide[] = [
  {
    id: "salle-lounge",
    name: "Salle Lounge",
    capacity: 50,
    isOutdoor: false,
    description: "Notre salle principale avec son espace bar : l'endroit idéal pour un moment convivial entre amis ou en famille, dans une atmosphère chaleureuse et décontractée.",
    imageUrl: "/img/salleprincipale.jpg",
  },
  {
    id: "salle-idylle",
    name: "Salle Idylle",
    capacity: 40,
    isOutdoor: false,
    description: "Un cadre raffiné et élégant, pensé pour les repas intimes. Lumières tamisées et décoration soignée font de cette salle le choix parfait pour vos dîners en amoureux ou vos célébrations.",
    imageUrl: "/img/salle2-1024x682.jpg",
  },
  {
    id: "salle-cosy",
    name: "Salle Cosy",
    capacity: 30,
    isOutdoor: false,
    description: "Une atmosphère dynamique et contemporaine, idéale pour vos déjeuners d'affaires, réunions d'équipe ou tout événement qui mérite un cadre au goût du jour.",
    imageUrl: "/img/salle3-1024x682.jpg",
  },
  {
    id: "salle-seminaire",
    name: "Salle Séminaire",
    capacity: 50,
    isOutdoor: false,
    description: "Dédiée aux séminaires et réceptions privées, notre grande salle peut accueillir jusqu'à 50 personnes. Privatisation disponible pour vos événements professionnels et personnels.",
    imageUrl: "/img/salle-reception-3-1-1024x682.jpg",
  },
  {
    id: "terrasse",
    name: "Terrasse",
    capacity: 35,
    isOutdoor: true,
    description: "Notre terrasse extérieure ombragée, ouverte aux beaux jours. Profitez d'un repas en plein air dans un cadre verdoyant et apaisant.",
    imageUrl: "/img/terrasse-1024x682.jpg",
  },
];

export function SpacesCarousel({ spaces }: { spaces: SpaceSlide[] }) {
  const slides = spaces.length > 0 ? spaces : FALLBACK_SLIDES;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = useCallback(
    (dir: number) => {
      setDirection(dir);
      setIndex((i) => (i + dir + slides.length) % slides.length);
    },
    [slides.length]
  );

  // Défilement automatique
  useEffect(() => {
    const timer = setInterval(() => go(1), 6000);
    return () => clearInterval(timer);
  }, [go]);

  const current = slides[index];

  return (
    <section id="espaces" className="scroll-mt-24 bg-stone-950 py-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-400">
            4 espaces, 1 adresse
          </p>
          <h2 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">
            Nos Espaces
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-stone-400">
            Trois salles intérieures et une terrasse extérieure : du déjeuner en
            tête-à-tête au séminaire d&apos;entreprise, chaque espace s&apos;adapte à
            votre événement.
          </p>
        </Reveal>

        <Reveal delay={0.15} className="mt-14">
          <div className="relative overflow-hidden rounded-2xl">
            <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={current.id}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 80 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -80 }}
                  transition={{ duration: 0.55, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={current.imageUrl ?? "/img/salle2-1024x682.jpg"}
                    alt={`${current.name} du restaurant La Virgule`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 100vw, 1280px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                </motion.div>
              </AnimatePresence>

              {/* Légende */}
              <div className="absolute bottom-0 left-0 z-10 p-6 sm:p-10">
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-3xl font-bold">{current.name}</h3>
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-stone-950">
                    {current.isOutdoor ? (
                      <Sun className="size-3.5" />
                    ) : (
                      <Home className="size-3.5" />
                    )}
                    {current.isOutdoor ? "Extérieur" : "Intérieur"}
                  </span>
                </div>
                <p className="mt-2 max-w-xl text-sm text-stone-200 sm:text-base">
                  {current.description}
                </p>
              </div>
            </div>

            {/* Contrôles */}
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Espace précédent"
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 backdrop-blur-sm transition-colors hover:bg-amber-500 hover:text-stone-950"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Espace suivant"
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-2 backdrop-blur-sm transition-colors hover:bg-amber-500 hover:text-stone-950"
            >
              <ChevronRight className="size-6" />
            </button>
          </div>

          {/* Indicateurs / miniatures */}
          <div className="mt-6 flex justify-center gap-3">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setIndex(i);
                }}
                aria-label={`Voir ${slide.name}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index ? "w-10 bg-amber-400" : "w-4 bg-stone-700 hover:bg-stone-500"
                )}
              />
            ))}
          </div>
        </Reveal>

        {/* CTA B2B */}
        <Reveal delay={0.25} className="mt-16">
          <div className="rounded-2xl border border-stone-800 bg-stone-900 p-8 text-center sm:p-12">
            <h3 className="font-serif text-2xl font-bold sm:text-3xl">
              Entreprises, associations, groupes
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-stone-400">
              Séminaires, repas d&apos;équipe, réceptions… Nous privatisons nos salles
              pour vos événements à partir de 12 personnes, et accueillons vos
              groupes le soir (15 personnes et plus) de janvier à août.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-7 bg-amber-500 px-8 font-semibold text-stone-950 hover:bg-amber-400 gap-2"
            >
              <a href={RESTAURANT.phoneHref}>
                <Phone className="size-5" />
                Appelez-nous : {RESTAURANT.phone}
              </a>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

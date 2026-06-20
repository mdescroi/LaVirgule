"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronDown, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RESTAURANT } from "@/lib/config";

export function HeroSection() {
  return (
    <section className="relative flex min-h-svh items-center justify-center overflow-hidden">
      <Image
        src="/img/vue_lavirgule_exterieur.jpg"
        alt="Le restaurant La Virgule à Chauray, vue extérieure"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center text-white">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-sm font-medium uppercase tracking-[0.35em] text-amber-400"
        >
          Restaurant — Niort · Chauray
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mt-6 font-serif text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl"
        >
          La Virgule<span className="text-amber-400">,</span>
          <br />
          <span className="text-3xl font-medium sm:text-4xl lg:text-5xl">
            la pause qui a du goût
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-stone-200"
        >
          Cuisine traditionnelle et généreuse au cœur de la zone de Chaban.
          Déjeuners gourmands, repas d&apos;affaires, séminaires et réceptions de
          groupes — quatre espaces pour tous vos moments.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button
            asChild
            size="lg"
            className="bg-amber-500 px-8 text-base font-semibold text-stone-950 hover:bg-amber-400 gap-2"
          >
            <a href={RESTAURANT.phoneHref}>
              <Phone className="size-5" />
              Réserver : {RESTAURANT.phone}
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/40 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
          >
            <a href="/carte">Découvrir la carte</a>
          </Button>
        </motion.div>
      </div>

      <motion.a
        href="/#menu-du-jour"
        aria-label="Découvrir le menu"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 8, 0] }}
        transition={{
          opacity: { delay: 1.2, duration: 0.6 },
          y: { repeat: Infinity, duration: 1.8, ease: "easeInOut" },
        }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-white/70 hover:text-white"
      >
        <ChevronDown className="size-8" />
      </motion.a>
    </section>
  );
}

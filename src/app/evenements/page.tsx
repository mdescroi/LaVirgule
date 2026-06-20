import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/site/reveal";
import { RESTAURANT } from "@/lib/config";
import { CalendarDays, Clock, MapPin, Phone } from "lucide-react";
import Link from "next/link";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Événements",
  description:
    "Retrouvez les prochains événements et soirées spéciales du restaurant La Virgule à Chauray — Niort.",
};

function formatDate(date: Date): { day: string; monthYear: string; time: string } {
  const day = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric" }).format(date);
  const monthYear = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date);
  return { day: day.charAt(0).toUpperCase() + day.slice(1), monthYear, time };
}

function formatEndTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export default async function EvenementsPage() {
  const now = new Date();

  const events = await prisma.event.findMany({
    where: { isPublished: true, date: { gte: now } },
    orderBy: { date: "asc" },
  });

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <div className="bg-stone-950 py-20 text-center">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-amber-400">
            Agenda
          </p>
          <h1 className="mt-4 font-serif text-5xl font-bold text-white sm:text-6xl">
            Événements
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-stone-400">
            Soirées à thème, dîners concerts, repas festifs… Réservez votre place.
          </p>
        </Reveal>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 space-y-10">
        {events.length === 0 ? (
          <Reveal className="rounded-2xl border border-dashed border-stone-300 bg-white py-20 text-center">
            <CalendarDays className="mx-auto size-10 text-stone-300" />
            <p className="mt-4 font-serif text-xl text-stone-500">
              Aucun événement à venir pour le moment.
            </p>
            <p className="mt-2 text-sm text-stone-400">
              Revenez bientôt ou{" "}
              <Link href="/contact" className="text-amber-600 hover:underline">
                contactez-nous
              </Link>{" "}
              pour organiser le vôtre.
            </p>
          </Reveal>
        ) : (
          events.map((ev, idx) => {
            const { day, monthYear, time } = formatDate(ev.date);
            return (
              <Reveal key={ev.id} delay={idx * 0.08}>
                <article className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                  {ev.imageUrl && (
                    <div className="relative h-56 w-full overflow-hidden sm:h-64">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ev.imageUrl}
                        alt={ev.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  )}

                  <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-8">
                    {/* Date encadrée */}
                    <div className="shrink-0 text-center sm:w-20">
                      <div className="inline-flex flex-col items-center rounded-xl border-2 border-amber-400 px-4 py-3 sm:w-full">
                        <span className="text-xs font-semibold uppercase tracking-widest text-amber-600">
                          {monthYear.split(" ")[0]}
                        </span>
                        <span className="font-serif text-3xl font-bold text-stone-900 leading-none">
                          {new Intl.DateTimeFormat("fr-FR", { day: "numeric" }).format(ev.date)}
                        </span>
                        <span className="mt-0.5 text-xs text-stone-500">
                          {monthYear.split(" ")[1]}
                        </span>
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <h2 className="font-serif text-2xl font-bold text-stone-900">
                        {ev.title}
                      </h2>

                      <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-500">
                        <li className="flex items-center gap-1.5">
                          <CalendarDays className="size-3.5 text-amber-500" />
                          {day}
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Clock className="size-3.5 text-amber-500" />
                          {time}
                          {ev.endDate && ` → ${formatEndTime(ev.endDate)}`}
                        </li>
                        {ev.location && (
                          <li className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 text-amber-500" />
                            {ev.location}
                          </li>
                        )}
                      </ul>

                      <p className="mt-3 leading-relaxed text-stone-600 whitespace-pre-line">
                        {ev.description}
                      </p>

                      <div className="mt-5">
                        <a
                          href={RESTAURANT.phoneHref}
                          className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-2.5 text-sm font-semibold text-stone-950 transition-colors hover:bg-amber-400"
                        >
                          <Phone className="size-4" />
                          Réserver : {RESTAURANT.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })
        )}
      </div>
    </main>
  );
}

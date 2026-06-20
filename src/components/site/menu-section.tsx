import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/site/reveal";
import Link from "next/link";

function formatPrice(price: unknown): string {
  return `${Number(price).toFixed(2).replace(".", ",")} €`;
}

export async function MenuSection() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const menuOfTheDay = await prisma.menuOfTheDay
    .findFirst({ where: { date: { gte: today } }, orderBy: { date: "asc" } })
    .catch(() => null);

  return (
    <section id="menu-du-jour" className="bg-stone-50 py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-600">
            Aujourd'hui
          </p>
          <h2 className="mt-3 font-serif text-4xl font-bold text-stone-900 sm:text-5xl">
            Le Menu du Jour
          </h2>
        </Reveal>

        {menuOfTheDay ? (
          <Reveal delay={0.15} className="mx-auto mt-12 max-w-2xl">
            <div className="relative rounded-2xl border border-amber-200 bg-white p-10 shadow-xl shadow-amber-100/50">
              <ul className="space-y-6 text-center">
                <li>
                  <p className="text-xs uppercase tracking-widest text-stone-400">Entrée</p>
                  <p className="mt-1 font-serif text-xl text-stone-800">
                    {menuOfTheDay.starterName}
                  </p>
                </li>
                <li aria-hidden className="font-serif text-2xl text-amber-400">~</li>
                <li>
                  <p className="text-xs uppercase tracking-widest text-stone-400">Plat</p>
                  <p className="mt-1 font-serif text-xl text-stone-800">
                    {menuOfTheDay.mainCourseName}
                  </p>
                </li>
                <li aria-hidden className="font-serif text-2xl text-amber-400">~</li>
                <li>
                  <p className="text-xs uppercase tracking-widest text-stone-400">Dessert</p>
                  <p className="mt-1 font-serif text-xl text-stone-800">
                    {menuOfTheDay.dessertName}
                  </p>
                </li>
              </ul>

              {/* Grille des 3 formules */}
              <div className="mt-8 grid grid-cols-3 divide-x divide-amber-100 rounded-xl border border-amber-100 bg-amber-50/60 text-center">
                <div className="px-3 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Entrée + Plat
                  </p>
                  <p className="mt-1 font-serif text-xl font-bold text-amber-600">
                    {formatPrice(menuOfTheDay.priceStarterMain)}
                  </p>
                </div>
                <div className="px-3 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Menu complet
                  </p>
                  <p className="mt-1 font-serif text-xl font-bold text-amber-600">
                    {formatPrice(menuOfTheDay.priceFullMenu)}
                  </p>
                </div>
                <div className="px-3 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Plat + Dessert
                  </p>
                  <p className="mt-1 font-serif text-xl font-bold text-amber-600">
                    {formatPrice(menuOfTheDay.priceMainDessert)}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={0.15} className="mt-12 text-center text-stone-500">
            <p>Le menu du jour sera bientôt disponible — appelez-nous pour le connaître !</p>
          </Reveal>
        )}

        <Reveal delay={0.3} className="mt-10 text-center">
          <Link
            href="/carte"
            className="inline-flex items-center gap-2 rounded-full border border-amber-400 px-6 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
          >
            Découvrir toute la carte →
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

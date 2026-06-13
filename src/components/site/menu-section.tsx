import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";

const CATEGORY_LABELS: Record<string, string> = {
  STARTER: "Entrées",
  MAIN: "Plats",
  DESSERT: "Desserts",
};

function formatPrice(price: unknown): string {
  return `${Number(price).toFixed(2).replace(".", ",")} €`;
}

export async function MenuSection() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [menuOfTheDay, dishes] = await Promise.all([
    prisma.menuOfTheDay
      .findFirst({ where: { date: { gte: today } }, orderBy: { date: "asc" } })
      .catch(() => null),
    prisma.dish
      .findMany({
        where: { isAvailable: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      })
      .catch(() => []),
  ]);

  const grouped = ["STARTER", "MAIN", "DESSERT"].map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    items: dishes.filter((d) => d.category === cat),
  }));

  return (
    <section id="menu-du-jour" className="bg-stone-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Menu du jour */}
        <Reveal className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-600">
            Aujourd&apos;hui
          </p>
          <h2 className="mt-3 font-serif text-4xl font-bold text-stone-900 sm:text-5xl">
            Le Menu du Jour
          </h2>
        </Reveal>

        {menuOfTheDay ? (
          <Reveal delay={0.15} className="mx-auto mt-12 max-w-2xl">
            <div className="relative rounded-2xl border border-amber-200 bg-white p-10 shadow-xl shadow-amber-100/50">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-stone-950 hover:bg-amber-500">
                {formatPrice(menuOfTheDay.price)} — Entrée · Plat · Dessert
              </Badge>
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
            </div>
          </Reveal>
        ) : (
          <Reveal delay={0.15} className="mt-12 text-center text-stone-500">
            <p>Le menu du jour sera bientôt disponible — appelez-nous pour le connaître !</p>
          </Reveal>
        )}

        {/* La Carte */}
        <div id="carte" className="mt-28 scroll-mt-24">
          <Reveal className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-600">
              Fait maison
            </p>
            <h2 className="mt-3 font-serif text-4xl font-bold text-stone-900 sm:text-5xl">
              La Carte
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-12 lg:grid-cols-3">
            {grouped.map((group, i) => (
              <Reveal key={group.category} delay={i * 0.12}>
                <h3 className="border-b-2 border-amber-400 pb-3 font-serif text-2xl font-semibold text-stone-900">
                  {group.label}
                </h3>
                <ul className="mt-6 space-y-6">
                  {group.items.length === 0 && (
                    <li className="text-sm text-stone-400">
                      Carte en cours de mise à jour…
                    </li>
                  )}
                  {group.items.map((dish) => (
                    <li key={dish.id}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-medium text-stone-800">{dish.name}</span>
                        <span className="flex-1 border-b border-dotted border-stone-300" />
                        <span className="font-semibold text-amber-700">
                          {formatPrice(dish.price)}
                        </span>
                      </div>
                      {dish.description && (
                        <p className="mt-1 text-sm text-stone-500">{dish.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

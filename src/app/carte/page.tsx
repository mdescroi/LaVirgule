import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Reveal } from "@/components/site/reveal";
import { RESTAURANT } from "@/lib/config";
import { Phone } from "lucide-react";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "La Carte",
  description:
    "Découvrez la carte du restaurant La Virgule : entrées, plats (salades, viandes, burgers, poissons, végétarien, fromages) et desserts.",
};

function formatPrice(price: unknown): string {
  return `${Number(price).toFixed(2).replace(".", ",")} €`;
}

const CATEGORY_CONFIG = [
  { key: "STARTER" as const, label: "Entrées",  accent: "border-amber-400",  note: null as string | null },
  { key: "MAIN"    as const, label: "Plats",    accent: "border-stone-800",  note: null as string | null },
  { key: "DESSERT" as const, label: "Desserts", accent: "border-amber-400",  note: "Nos desserts sont à commander en début de repas." },
];

export default async function CartePage() {
  const [dishes, subCategories] = await Promise.all([
    prisma.dish.findMany({
      where: { isAvailable: true },
      include: { subCategory: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.dishSubCategory.findMany({
      orderBy: [{ parentCategory: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <div className="bg-stone-950 py-20 text-center">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-amber-400">
            Fait maison
          </p>
          <h1 className="mt-4 font-serif text-5xl font-bold text-white sm:text-6xl">
            La Carte
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-stone-400">
            Cuisine traditionnelle et généreuse - tous nos plats sont préparés sur place.
          </p>
        </Reveal>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 space-y-20">
        {CATEGORY_CONFIG.map(({ key, label, accent, note }) => {
          const categoryDishes = dishes.filter((d) => d.category === key);
          if (categoryDishes.length === 0) return null;

          const subCatsForCategory = subCategories.filter((sc) => sc.parentCategory === key);
          const withSub    = categoryDishes.filter((d) => d.subCategoryId);
          const withoutSub = categoryDishes.filter((d) => !d.subCategoryId);

          return (
            <section key={key}>
              <Reveal>
                <h2
                  className={`border-b-4 ${accent} pb-3 font-serif text-3xl font-bold text-stone-900 sm:text-4xl`}
                >
                  {label}
                </h2>
                {note && (
                  <p className="mt-2 text-sm italic text-amber-600">{note}</p>
                )}
              </Reveal>

              <div className="mt-8 space-y-10">
                {subCatsForCategory.length > 0 ? (
                  <>
                    {subCatsForCategory.map((sc) => {
                      const items = withSub.filter((d) => d.subCategoryId === sc.id);
                      if (items.length === 0) return null;
                      return (
                        <div key={sc.id}>
                          <h3 className="mb-4 font-serif text-xl font-semibold text-stone-700 border-b border-stone-200 pb-2">
                            {sc.name}
                          </h3>
                          <DishList dishes={items} />
                        </div>
                      );
                    })}
                    {withoutSub.length > 0 && (
                      <div>
                        <h3 className="mb-4 font-serif text-xl font-semibold text-stone-700 border-b border-stone-200 pb-2">
                          Autres
                        </h3>
                        <DishList dishes={withoutSub} />
                      </div>
                    )}
                  </>
                ) : (
                  <DishList dishes={categoryDishes} />
                )}
              </div>
            </section>
          );
        })}

        {/* CTA téléphone */}
        <Reveal className="rounded-2xl bg-stone-950 px-8 py-10 text-center text-white">
          <p className="font-serif text-2xl font-bold">
            Une question sur la carte ?
          </p>
          <p className="mt-2 text-stone-400">
            N&apos;hésitez pas à nous appeler, on se fera un plaisir de vous renseigner.
          </p>
          <a
            href={RESTAURANT.phoneHref}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500 px-8 py-3 font-semibold text-stone-950 transition-colors hover:bg-amber-400"
          >
            <Phone className="size-5" />
            {RESTAURANT.phone}
          </a>
        </Reveal>
      </div>
    </main>
  );
}

function DishList({
  dishes,
}: {
  dishes: Array<{
    id: string;
    name: string;
    description: string;
    price: unknown;
  }>;
}) {
  return (
    <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white shadow-sm">
      {dishes.map((dish) => (
        <li key={dish.id} className="flex items-baseline justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <span className="font-medium text-stone-800">{dish.name}</span>
            {dish.description && (
              <p className="mt-0.5 text-sm text-stone-500">{dish.description}</p>
            )}
          </div>
          <span className="shrink-0 font-semibold text-amber-700">
            {formatPrice(dish.price)}
          </span>
        </li>
      ))}
    </ul>
  );
}

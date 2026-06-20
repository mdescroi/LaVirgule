import { UtensilsCrossed, BookOpen, CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const now = new Date();

  const [activeDishCount, totalDishCount, todayMenu] = await Promise.all([
    prisma.dish.count({ where: { isAvailable: true } }),
    prisma.dish.count(),
    prisma.menuOfTheDay.findFirst({
      where: {
        date: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      },
    }),
  ]);

  const todayLabel = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const stats = [
    {
      label: "Plats actifs à la carte",
      value: activeDishCount,
      sub: `/ ${totalDishCount} au total`,
      icon: UtensilsCrossed,
    },
    {
      label: "Menu du jour",
      value: todayMenu ? 1 : 0,
      sub: todayMenu ? "Défini aujourd'hui" : "Non défini",
      icon: CalendarDays,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm capitalize text-stone-500">{todayLabel}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">
                {stat.label}
              </CardTitle>
              <stat.icon className="size-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-1.5">
                <p className="text-3xl font-bold text-stone-900">{stat.value}</p>
                {stat.sub && (
                  <span className="text-sm font-medium text-stone-400">
                    {stat.sub}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <BookOpen className="size-4 text-amber-600" />
            Menu du jour
          </CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/menu">Modifier</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {!todayMenu ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <p className="text-sm text-stone-400">
                Aucun menu du jour défini pour aujourd'hui.
              </p>
              <Button asChild size="sm" className="bg-amber-500 text-stone-950 hover:bg-amber-400">
                <Link href="/admin/menu">Définir le menu du jour</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {[
                { label: "Entrée", value: todayMenu.starterName },
                { label: "Plat", value: todayMenu.mainCourseName },
                { label: "Dessert", value: todayMenu.dessertName },
              ].map((item) => (
                <li key={item.label} className="flex items-center justify-between py-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-stone-400 w-20">
                    {item.label}
                  </span>
                  <span className="flex-1 font-medium text-stone-900">{item.value}</span>
                </li>
              ))}
              <li className="flex flex-wrap gap-3 py-3 text-sm text-stone-500">
                <span>E+P : {Number(todayMenu.priceStarterMain).toFixed(2)} €</span>
                <span>·</span>
                <span>Complet : {Number(todayMenu.priceFullMenu).toFixed(2)} €</span>
                <span>·</span>
                <span>P+D : {Number(todayMenu.priceMainDessert).toFixed(2)} €</span>
              </li>
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

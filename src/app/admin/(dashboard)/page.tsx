import Link from "next/link";
import { CalendarDays, Clock, Users, UtensilsCrossed } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [todayReservations, pendingGroups, todayGuests, dishCount] =
    await Promise.all([
      prisma.reservation.count({
        where: {
          date: { gte: startOfDay, lt: endOfDay },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.reservation.count({ where: { status: "PENDING", isGroup: true } }),
      prisma.reservation.aggregate({
        where: {
          date: { gte: startOfDay, lt: endOfDay },
          status: "CONFIRMED",
        },
        _sum: { guestCount: true },
      }),
      prisma.dish.count({ where: { isAvailable: true } }),
    ]);

  const recentPending = await prisma.reservation.findMany({
    where: { status: "PENDING" },
    include: { space: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const stats = [
    {
      label: "Réservations aujourd'hui",
      value: todayReservations,
      icon: CalendarDays,
    },
    {
      label: "Couverts confirmés aujourd'hui",
      value: todayGuests._sum.guestCount ?? 0,
      icon: Users,
    },
    {
      label: "Demandes de groupe en attente",
      value: pendingGroups,
      icon: Clock,
    },
    { label: "Plats à la carte", value: dishCount, icon: UtensilsCrossed },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Vue d&apos;ensemble de l&apos;activité du restaurant.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">
                {stat.label}
              </CardTitle>
              <stat.icon className="size-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-stone-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dernières demandes en attente</CardTitle>
          <Link
            href="/admin/reservations"
            className="text-sm font-medium text-amber-700 hover:underline"
          >
            Tout voir →
          </Link>
        </CardHeader>
        <CardContent>
          {recentPending.length === 0 ? (
            <p className="text-sm text-stone-500">
              Aucune demande en attente. 🎉
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {recentPending.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="font-medium text-stone-900">
                      {r.firstName} {r.customerName}
                      {r.isGroup && (
                        <Badge className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-100">
                          Groupe — {r.guestCount} pers.
                        </Badge>
                      )}
                    </p>
                    <p className="text-sm text-stone-500">
                      {new Date(r.date).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}{" "}
                      · {r.slot === "LUNCH" ? "Midi" : "Soir"} ·{" "}
                      {r.space?.name ?? "Espace indifférent"}
                    </p>
                  </div>
                  <p className="text-sm text-stone-500">{r.phone}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

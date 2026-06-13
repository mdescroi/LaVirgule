import Link from "next/link";
import { CalendarDays, Clock, Lock, Users, UtensilsCrossed } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddReservationDialog } from "@/components/admin/add-reservation-dialog";
import { EditReservationDialog } from "@/components/admin/edit-reservation-dialog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Confirmée", className: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Annulée", className: "bg-red-100 text-red-700" },
};

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const todayDateParam = now.toISOString().split("T")[0];

  const [todayReservations, pendingGroups, todayGuestsAgg, dishCount, spaces] =
    await Promise.all([
      prisma.reservation.count({
        where: {
          date: { gte: startOfDay, lt: endOfDay },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.reservation.count({ where: { status: "PENDING", isGroup: true } }),
      prisma.reservation.aggregate({
        where: { date: { gte: startOfDay, lt: endOfDay }, status: "CONFIRMED" },
        _sum: { guestCount: true },
      }),
      prisma.dish.count({ where: { isAvailable: true } }),
      prisma.space.findMany({ orderBy: { name: "asc" } }),
    ]);

  // Capacité totale de tous les espaces
  const totalCapacity = spaces.reduce((s, sp) => s + sp.capacity, 0);
  const todayGuests = todayGuestsAgg._sum.guestCount ?? 0;

  // Réservations d'aujourd'hui détaillées
  const todayList = await prisma.reservation.findMany({
    where: { date: { gte: startOfDay, lt: endOfDay } },
    include: { space: true },
    orderBy: [{ slot: "asc" }, { createdAt: "asc" }],
  });

  // 5 dernières demandes de groupes en attente (tous jours)
  const pendingGroupList = await prisma.reservation.findMany({
    where: { status: "PENDING" },
    include: { space: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const spaceOptions = spaces.map((s) => ({
    id: s.id,
    name: s.name,
    capacity: s.capacity,
    isOutdoor: s.isOutdoor,
  }));

  const stats = [
    { label: "Réservations aujourd'hui", value: todayReservations, icon: CalendarDays, sub: null },
    { label: "Couverts confirmés ce jour", value: todayGuests, icon: Users, sub: `/ ${totalCapacity} cap.` },
    { label: "Demandes de groupe en attente", value: pendingGroups, icon: Clock, sub: null },
    { label: "Plats à la carte actifs", value: dishCount, icon: UtensilsCrossed, sub: null },
  ];

  const todayLabel = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-stone-500 capitalize">{todayLabel}</p>
        </div>
        <AddReservationDialog spaces={spaceOptions} />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <p
                  className={cn(
                    "text-3xl font-bold",
                    stat.sub && stat.value > totalCapacity ? "text-red-600" : "text-stone-900"
                  )}
                >
                  {stat.value}
                </p>
                {stat.sub && (
                  <span className="text-sm font-medium text-stone-400">{stat.sub}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Réservations du jour */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-serif text-lg">
            Réservations du jour
          </CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link href={`/admin/reservations?date=${todayDateParam}`}>
              Tout voir →
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {todayList.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-400">
              Aucune réservation aujourd&apos;hui.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {todayList.map((r) => {
                const status = STATUS_LABELS[r.status];
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-stone-900">
                        {r.firstName} {r.customerName}
                        {r.isGroup && (
                          <Badge className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px]">
                            Groupe — {r.guestCount} pers.
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-stone-500">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium mr-1.5",
                            r.slot === "LUNCH"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-indigo-100 text-indigo-800"
                          )}
                        >
                          {r.slot === "LUNCH" ? "Midi" : "Soir"}
                        </span>
                        {!r.isGroup && <>{r.guestCount} pers. · </>}
                        {r.space?.name ? (
                          <>
                            {r.space.name}
                            {r.isGroup && r.status === "CONFIRMED" && (
                              <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-semibold text-violet-700">
                                <Lock className="size-2.5" /> Privatisée
                              </span>
                            )}
                          </>
                        ) : r.isGroup ? (
                          <span className="italic text-amber-600">Salle à définir</span>
                        ) : (
                          "Espace indifférent"
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-stone-500">{r.phone}</p>
                      <Badge
                        className={cn(
                          status.className,
                          "hover:" + status.className,
                          "text-[10px]"
                        )}
                      >
                        {status.label}
                      </Badge>
                      <EditReservationDialog
                        spaces={spaceOptions}
                        reservation={{
                          id: r.id,
                          firstName: r.firstName,
                          customerName: r.customerName,
                          email: r.email,
                          phone: r.phone,
                          date: new Date(r.date).toISOString().split("T")[0],
                          slot: r.slot,
                          guestCount: r.guestCount,
                          spaceId: r.spaceId,
                          status: r.status,
                          message: r.message,
                          isGroup: r.isGroup,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Demandes de groupes en attente */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-serif text-lg">
            Demandes de groupes en attente
            {pendingGroups > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-100">
                {pendingGroups}
              </Badge>
            )}
          </CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/reservations?statut=PENDING">
              Tout voir →
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {pendingGroupList.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-400">
              Aucune demande en attente. 🎉
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {pendingGroupList.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900">
                      {r.firstName} {r.customerName}
                      <Badge className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px]">
                        {r.guestCount} pers.
                      </Badge>
                    </p>
                    <p className="text-sm text-stone-500">
                      {new Date(r.date).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      · {r.slot === "LUNCH" ? "Midi" : "Soir"} ·{" "}
                      {r.space?.name ?? "Espace indifférent"}
                    </p>
                    {r.message && (
                      <p className="mt-0.5 max-w-xs truncate text-xs italic text-stone-400">
                        « {r.message} »
                      </p>
                    )}
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

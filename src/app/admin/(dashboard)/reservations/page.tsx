import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddReservationDialog } from "@/components/admin/add-reservation-dialog";
import { EditReservationDialog } from "@/components/admin/edit-reservation-dialog";
import { updateReservationStatus } from "@/app/actions/admin";
import { ReservationFilters } from "@/components/admin/reservation-filters";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Confirmée", className: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Annulée", className: "bg-red-100 text-red-700" },
};

type SearchParams = Promise<{
  salle?: string;
  statut?: string;
  date?: string;
}>;

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const spaces = await prisma.space.findMany({ orderBy: { name: "asc" } });

  const todayStr = new Date().toISOString().split("T")[0];
  const selectedDate = params.date ?? todayStr;

  const where: Prisma.ReservationWhereInput = {};

  if (params.salle && params.salle !== "all") {
    where.spaceId = params.salle;
  }
  if (params.statut && params.statut !== "all") {
    where.status = params.statut as "PENDING" | "CONFIRMED" | "CANCELLED";
  }
  if (selectedDate !== "all") {
    const day = new Date(selectedDate);
    day.setUTCHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setUTCDate(next.getUTCDate() + 1);
    where.date = { gte: day, lt: next };
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: { space: true },
    orderBy: [{ date: "asc" }, { slot: "asc" }, { createdAt: "asc" }],
    take: 300,
  });

  const totalGuests = reservations
    .filter((r) => r.status !== "CANCELLED")
    .reduce((s, r) => s + r.guestCount, 0);
  const pendingCount = reservations.filter((r) => r.status === "PENDING").length;
  const confirmedCount = reservations.filter((r) => r.status === "CONFIRMED").length;

  // Capacité totale de tous les espaces (somme)
  const totalCapacity = spaces.reduce((s, sp) => s + sp.capacity, 0);

  // Capacité de l'espace sélectionné si filtre salle actif
  const filteredSpaceCapacity =
    params.salle && params.salle !== "all"
      ? (spaces.find((sp) => sp.id === params.salle)?.capacity ?? totalCapacity)
      : totalCapacity;

  const spaceOptions = spaces.map((s) => ({
    id: s.id,
    name: s.name,
    capacity: s.capacity,
    isOutdoor: s.isOutdoor,
  }));

  const isFiltered = !!(
    (selectedDate !== "all") ||
    (params.salle && params.salle !== "all") ||
    (params.statut && params.statut !== "all")
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">
            Réservations
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Gérez, validez et ajoutez des réservations (téléphone inclus).
          </p>
        </div>
        <AddReservationDialog spaces={spaceOptions} />
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-xs text-stone-500">Résultats</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{reservations.length}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-xs text-stone-500">Couverts (hors annulés)</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span
              className={cn(
                "text-2xl font-bold",
                totalGuests > filteredSpaceCapacity ? "text-red-600" : "text-stone-900"
              )}
            >
              {totalGuests}
            </span>
            <span className="text-sm font-medium text-stone-400">
              / {filteredSpaceCapacity}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-stone-400">
            {params.salle && params.salle !== "all"
              ? `Capacité salle sélectionnée`
              : `Capacité totale restaurant`}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-xs text-stone-500">Confirmées</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{confirmedCount}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-xs text-stone-500">En attente</p>
          <p className={cn("mt-1 text-2xl font-bold", pendingCount > 0 ? "text-amber-700" : "text-stone-900")}>
            {pendingCount}
          </p>
        </div>
      </div>

      {/* Filtres client */}
      <ReservationFilters
        spaces={spaceOptions}
        currentDate={selectedDate}
        currentSalle={params.salle ?? "all"}
        currentStatut={params.statut ?? "all"}
      />

      {/* Tableau */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        {!isFiltered && reservations.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg font-semibold text-stone-600">
              Sélectionnez une date ou un filtre pour afficher les réservations
            </p>
            <p className="mt-1 text-sm text-stone-400">
              Ou cliquez sur « Nouvelle réservation » pour en créer une.
            </p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <p className="text-base">Aucune réservation pour ces critères.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50">
                <TableHead className="font-semibold text-stone-700">Client</TableHead>
                <TableHead className="font-semibold text-stone-700">Date</TableHead>
                <TableHead className="font-semibold text-stone-700">Service</TableHead>
                <TableHead className="font-semibold text-stone-700">Couverts</TableHead>
                <TableHead className="font-semibold text-stone-700">Espace</TableHead>
                <TableHead className="font-semibold text-stone-700">Contact</TableHead>
                <TableHead className="font-semibold text-stone-700">Statut</TableHead>
                <TableHead className="text-right font-semibold text-stone-700">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((r, i) => {
                const status = STATUS_LABELS[r.status];
                return (
                  <TableRow
                    key={r.id}
                    className={cn(
                      "transition-colors hover:bg-stone-50",
                      r.isGroup
                        ? "bg-amber-50/40"
                        : i % 2 === 1
                          ? "bg-white"
                          : "bg-stone-50/30"
                    )}
                  >
                    <TableCell>
                      <p className="font-semibold text-stone-900">
                        {r.firstName} {r.customerName}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.isGroup && (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px]">
                            Groupe
                          </Badge>
                        )}
                        {r.message && (
                          <span
                            className="max-w-[180px] truncate text-xs italic text-stone-400"
                            title={r.message}
                          >
                            « {r.message} »
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(r.date).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                          r.slot === "LUNCH"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-indigo-100 text-indigo-800"
                        )}
                      >
                        {r.slot === "LUNCH" ? "Midi" : "Soir"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-base font-bold text-stone-800">
                        {r.guestCount}
                      </span>
                      <span className="ml-1 text-xs text-stone-400">pers.</span>
                    </TableCell>
                    <TableCell className="text-sm text-stone-600">
                      {r.space?.name ? (
                        <div className="flex flex-col gap-0.5">
                          <span>{r.space.name}</span>
                          {r.isGroup && r.status === "CONFIRMED" && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-700">
                              <Lock className="size-3" /> Privatisée
                            </span>
                          )}
                          {r.isGroup && r.status === "PENDING" && (
                            <span className="text-[10px] text-amber-600">En attente d’attribution</span>
                          )}
                        </div>
                      ) : r.isGroup && r.status === "PENDING" ? (
                        <span className="italic text-amber-600">En attente d’attribution</span>
                      ) : (
                        <span className="italic text-stone-400">Indifférent</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-stone-800">{r.phone}</p>
                      {r.email && (
                        <p className="max-w-[140px] truncate text-xs text-stone-400">
                          {r.email}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(status.className, "hover:" + status.className, "text-xs")}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
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
                        {r.status !== "CONFIRMED" && (
                          <form action={updateReservationStatus}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="status" value="CONFIRMED" />
                            <Button
                              type="submit"
                              size="sm"
                              className="h-7 bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-500"
                            >
                              Valider
                            </Button>
                          </form>
                        )}
                        {r.status !== "CANCELLED" && (
                          <form action={updateReservationStatus}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="status" value="CANCELLED" />
                            <Button
                              type="submit"
                              size="sm"
                              variant="destructive"
                              className="h-7 px-2 text-xs"
                            >
                              Annuler
                            </Button>
                          </form>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <p className="text-right text-xs text-stone-400">
        {reservations.length} résultat{reservations.length > 1 ? "s" : ""} affiché
        {reservations.length > 1 ? "s" : ""}
      </p>
    </div>
  );
}

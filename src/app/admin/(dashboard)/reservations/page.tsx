import Link from "next/link";
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
import { updateReservationStatus } from "@/app/actions/admin";
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
  periode?: string;
}>;

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const spaces = await prisma.space.findMany({ orderBy: { name: "asc" } });

  const where: Prisma.ReservationWhereInput = {};

  if (params.salle && params.salle !== "all") {
    where.spaceId = params.salle;
  }
  if (params.statut && params.statut !== "all") {
    where.status = params.statut as "PENDING" | "CONFIRMED" | "CANCELLED";
  }
  if (params.periode === "jour") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    where.date = { gte: start, lt: end };
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: { space: true },
    orderBy: [{ date: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  function buildHref(overrides: Record<string, string>) {
    const next = new URLSearchParams({
      salle: params.salle ?? "all",
      statut: params.statut ?? "all",
      periode: params.periode ?? "all",
      ...overrides,
    });
    return `/admin/reservations?${next.toString()}`;
  }

  const filterChip =
    "rounded-full border px-3 py-1 text-xs font-medium transition-colors";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Réservations
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Gérez les réservations et validez les demandes de groupes (≥ 12 pers.).
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase text-stone-400">
          Période :
        </span>
        {[
          { value: "all", label: "Toutes" },
          { value: "jour", label: "Aujourd'hui" },
        ].map((p) => (
          <Link
            key={p.value}
            href={buildHref({ periode: p.value })}
            className={cn(
              filterChip,
              (params.periode ?? "all") === p.value
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 bg-white text-stone-600 hover:border-stone-500"
            )}
          >
            {p.label}
          </Link>
        ))}

        <span className="ml-3 text-xs font-semibold uppercase text-stone-400">
          Salle :
        </span>
        <Link
          href={buildHref({ salle: "all" })}
          className={cn(
            filterChip,
            (params.salle ?? "all") === "all"
              ? "border-stone-900 bg-stone-900 text-white"
              : "border-stone-300 bg-white text-stone-600 hover:border-stone-500"
          )}
        >
          Toutes
        </Link>
        {spaces.map((space) => (
          <Link
            key={space.id}
            href={buildHref({ salle: space.id })}
            className={cn(
              filterChip,
              params.salle === space.id
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 bg-white text-stone-600 hover:border-stone-500"
            )}
          >
            {space.name}
          </Link>
        ))}

        <span className="ml-3 text-xs font-semibold uppercase text-stone-400">
          Statut :
        </span>
        {[
          { value: "all", label: "Tous" },
          { value: "PENDING", label: "En attente" },
          { value: "CONFIRMED", label: "Confirmées" },
          { value: "CANCELLED", label: "Annulées" },
        ].map((s) => (
          <Link
            key={s.value}
            href={buildHref({ statut: s.value })}
            className={cn(
              filterChip,
              (params.statut ?? "all") === s.value
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 bg-white text-stone-600 hover:border-stone-500"
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Date & service</TableHead>
              <TableHead>Couverts</TableHead>
              <TableHead>Salle</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservations.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-stone-500">
                  Aucune réservation pour ces filtres.
                </TableCell>
              </TableRow>
            )}
            {reservations.map((r) => {
              const status = STATUS_LABELS[r.status];
              return (
                <TableRow key={r.id} className={cn(r.isGroup && "bg-amber-50/50")}>
                  <TableCell>
                    <p className="font-medium text-stone-900">
                      {r.firstName} {r.customerName}
                    </p>
                    {r.isGroup && (
                      <Badge className="mt-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
                        Groupe / Devis
                      </Badge>
                    )}
                    {r.message && (
                      <p className="mt-1 max-w-52 truncate text-xs text-stone-500" title={r.message}>
                        « {r.message} »
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(r.date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                    <p className="text-xs text-stone-500">
                      {r.slot === "LUNCH" ? "Midi (12h–14h)" : "Soir (19h–21h30)"}
                    </p>
                  </TableCell>
                  <TableCell className="font-semibold">{r.guestCount}</TableCell>
                  <TableCell>{r.space?.name ?? "Indifférent"}</TableCell>
                  <TableCell>
                    <p className="text-xs">{r.phone}</p>
                    <p className="text-xs text-stone-500">{r.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(status.className, "hover:" + status.className)}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {r.status !== "CONFIRMED" && (
                        <form action={updateReservationStatus}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="status" value="CONFIRMED" />
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-emerald-600 text-white hover:bg-emerald-500"
                          >
                            Valider
                          </Button>
                        </form>
                      )}
                      {r.status !== "CANCELLED" && (
                        <form action={updateReservationStatus}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="status" value="CANCELLED" />
                          <Button type="submit" size="sm" variant="destructive">
                            Refuser
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
      </div>
    </div>
  );
}

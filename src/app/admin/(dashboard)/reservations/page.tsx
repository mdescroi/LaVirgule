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
import { ValidateGroupDialog } from "@/components/admin/validate-group-dialog";
import { updateReservationStatus } from "@/app/actions/admin";
import { ReservationFilters } from "@/components/admin/reservation-filters";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  Lock,
  Mail,
  Moon,
  Phone,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ONLINE_SERVICE_CAP } from "@/lib/config";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Confirmée", className: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Annulée", className: "bg-red-100 text-red-700" },
};

const SPACE_PREFERENCE_LABELS: Record<string, string> = {
  INDOOR: "Intérieur",
  OUTDOOR: "Extérieur",
  ANY: "Indifférent",
};

const SERVICE_ORDER = ["LUNCH", "DINNER", "OTHER"] as const;
type Slot = (typeof SERVICE_ORDER)[number];

const SERVICE_META: Record<
  Slot,
  { label: string; time: string; Icon: typeof Sun; headerClass: string; iconClass: string }
> = {
  LUNCH: {
    label: "Midi",
    time: "12h – 14h",
    Icon: Sun,
    headerClass: "bg-sky-50 border-sky-200",
    iconClass: "bg-sky-100 text-sky-700",
  },
  DINNER: {
    label: "Soir",
    time: "19h – 21h",
    Icon: Moon,
    headerClass: "bg-indigo-50 border-indigo-200",
    iconClass: "bg-indigo-100 text-indigo-700",
  },
  OTHER: {
    label: "Autre / Journée",
    time: "Événement, journée entière",
    Icon: CalendarClock,
    headerClass: "bg-violet-50 border-violet-200",
    iconClass: "bg-violet-100 text-violet-700",
  },
};

type Periode =
  | "a_venir"
  | "today"
  | "tomorrow"
  | "semaine"
  | "passees"
  | "toutes"
  | "jour"
  | "plage";
type ResType = "all" | "group" | "solo";

const PERIODES: Periode[] = [
  "a_venir",
  "today",
  "tomorrow",
  "semaine",
  "passees",
  "toutes",
  "jour",
  "plage",
];

type SearchParams = Promise<{
  salle?: string;
  statut?: string;
  date?: string;
  periode?: string;
  from?: string;
  to?: string;
  type?: string;
}>;

function addUTCDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() + n);
  return c;
}

function fmtLong(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  });
}

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const spaces = await prisma.space.findMany({ orderBy: { name: "asc" } });

  const todayStr = new Date().toISOString().split("T")[0];
  const todayStart = new Date(`${todayStr}T00:00:00Z`);

  const periode: Periode = PERIODES.includes(params.periode as Periode)
    ? (params.periode as Periode)
    : "a_venir";
  const resType: ResType =
    params.type === "group" || params.type === "solo" ? params.type : "all";

  const where: Prisma.ReservationWhereInput = {};

  if (params.salle && params.salle !== "all") {
    where.spaceId = params.salle;
  }
  if (params.statut && params.statut !== "all") {
    where.status = params.statut as "PENDING" | "CONFIRMED" | "CANCELLED";
  }
  if (resType === "group") where.isGroup = true;
  else if (resType === "solo") where.isGroup = false;

  // ── Filtre temporel selon la période choisie ───────────────────────
  let orderDir: "asc" | "desc" = "asc";
  let singleDay = false;
  let headerLabel = "Réservations à venir";
  const selectedDay =
    params.date && params.date !== "all"
      ? new Date(`${params.date}T00:00:00Z`)
      : todayStart;

  switch (periode) {
    case "today":
      where.date = { gte: todayStart, lt: addUTCDays(todayStart, 1) };
      singleDay = true;
      headerLabel = `Aujourd'hui - ${fmtLong(todayStart)}`;
      break;
    case "tomorrow": {
      const t = addUTCDays(todayStart, 1);
      where.date = { gte: t, lt: addUTCDays(t, 1) };
      singleDay = true;
      headerLabel = `Demain - ${fmtLong(t)}`;
      break;
    }
    case "semaine":
      where.date = { gte: todayStart, lt: addUTCDays(todayStart, 7) };
      headerLabel = `Cette semaine - du ${fmtShort(todayStart)} au ${fmtShort(
        addUTCDays(todayStart, 6)
      )}`;
      break;
    case "passees":
      where.date = { lt: todayStart };
      orderDir = "desc";
      headerLabel = "Réservations passées";
      break;
    case "toutes":
      headerLabel = "Toutes les réservations";
      break;
    case "jour":
      where.date = { gte: selectedDay, lt: addUTCDays(selectedDay, 1) };
      singleDay = true;
      headerLabel = fmtLong(selectedDay);
      break;
    case "plage": {
      const from = params.from ? new Date(`${params.from}T00:00:00Z`) : todayStart;
      const to = params.to
        ? addUTCDays(new Date(`${params.to}T00:00:00Z`), 1)
        : addUTCDays(from, 7);
      where.date = { gte: from, lt: to };
      headerLabel = `Du ${fmtShort(from)} au ${fmtShort(addUTCDays(to, -1))}`;
      break;
    }
    case "a_venir":
    default:
      where.date = { gte: todayStart };
      headerLabel = "Réservations à venir";
      break;
  }

  const reservations = await prisma.reservation.findMany({
    where,
    include: { space: true },
    orderBy: [{ date: orderDir }, { slot: "asc" }, { createdAt: "asc" }],
    take: 300,
  });

  type Reservation = (typeof reservations)[number];

  const spaceOptions = spaces.map((s) => ({
    id: s.id,
    name: s.name,
    capacity: s.capacity,
    isOutdoor: s.isOutdoor,
  }));

  // ── Aperçu des 7 prochains jours (toujours calculé, indépendant des filtres) ──
  const weekEnd = addUTCDays(todayStart, 7);
  const weekRes = await prisma.reservation.findMany({
    where: { date: { gte: todayStart, lt: weekEnd }, status: { not: "CANCELLED" } },
    select: { date: true, guestCount: true, isGroup: true, status: true },
  });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addUTCDays(todayStart, i);
    const key = d.toISOString().split("T")[0];
    const items = weekRes.filter((r) => r.date.toISOString().split("T")[0] === key);
    return {
      key,
      date: d,
      count: items.length,
      covers: items.reduce((s, r) => s + r.guestCount, 0),
      pending: items.filter((r) => r.isGroup && r.status === "PENDING").length,
    };
  });
  const weekTotalCount = weekRes.length;
  const weekTotalCovers = weekRes.reduce((s, r) => s + r.guestCount, 0);

  // Préserve salle / statut / type dans les liens de l'aperçu semaine
  const preserved = new URLSearchParams();
  if (params.salle && params.salle !== "all") preserved.set("salle", params.salle);
  if (params.statut && params.statut !== "all") preserved.set("statut", params.statut);
  if (resType !== "all") preserved.set("type", resType);
  const dayHref = (key: string) => {
    const p = new URLSearchParams(preserved);
    p.set("periode", "jour");
    p.set("date", key);
    return `/admin/reservations?${p.toString()}`;
  };

  // ── Métriques de la vue courante ───────────────────────────────────
  const active = reservations.filter((r) => r.status !== "CANCELLED");
  const totalGuests = active.reduce((s, r) => s + r.guestCount, 0);
  const cancelledCount = reservations.filter((r) => r.status === "CANCELLED").length;
  const pendingGroups = reservations.filter((r) => r.isGroup && r.status === "PENDING");

  const dayLabel = headerLabel;

  const isFiltered =
    periode !== "a_venir" ||
    resType !== "all" ||
    (!!params.salle && params.salle !== "all") ||
    (!!params.statut && params.statut !== "all");

  // Sur une vue multi-jours, on regroupe par jour (l'ordre suit déjà orderDir).
  const dayGroups: { key: string; items: Reservation[] }[] = [];
  if (!singleDay) {
    for (const r of reservations) {
      const key = new Date(r.date).toISOString().split("T")[0];
      let g = dayGroups.find((x) => x.key === key);
      if (!g) {
        g = { key, items: [] };
        dayGroups.push(g);
      }
      g.items.push(r);
    }
  }

  // ── Rendu d'une ligne de réservation ───────────────────────────────
  const renderRow = (r: Reservation) => {
    const status = STATUS_LABELS[r.status];
    return (
      <TableRow
        key={r.id}
        className={cn(
          "transition-colors hover:bg-stone-50",
          r.status === "CANCELLED" && "opacity-55",
          r.isGroup && r.status !== "CANCELLED" && "bg-amber-50/40"
        )}
      >
        <TableCell>
          <p className="font-semibold text-stone-900">
            {r.firstName} {r.customerName}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {r.isGroup && (
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px]">
                Groupe
              </Badge>
            )}
            {r.isGroup && r.status === "PENDING" && (
              <Badge className="bg-amber-500 text-white hover:bg-amber-500 text-[10px]">
                À valider
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
        <TableCell className="whitespace-nowrap">
          <span className="text-lg font-bold text-stone-800">{r.guestCount}</span>
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
            </div>
          ) : r.isGroup && r.status === "PENDING" ? (
            <span className="italic text-amber-600">À attribuer</span>
          ) : r.spacePreference && r.spacePreference !== "ANY" ? (
            <span>Souhait : {SPACE_PREFERENCE_LABELS[r.spacePreference]}</span>
          ) : (
            <span className="italic text-stone-400">Indifférent</span>
          )}
        </TableCell>
        <TableCell className="whitespace-nowrap">
          <a
            href={`tel:${r.phone.replace(/\s/g, "")}`}
            className="flex items-center gap-1 text-sm font-medium text-stone-800 hover:text-amber-700"
          >
            <Phone className="size-3 text-stone-400" />
            {r.phone}
          </a>
          {r.email && (
            <a
              href={`mailto:${r.email}`}
              className="mt-0.5 flex max-w-[160px] items-center gap-1 truncate text-xs text-stone-400 hover:text-amber-700"
            >
              <Mail className="size-3 shrink-0" />
              <span className="truncate">{r.email}</span>
            </a>
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
            {r.status !== "CONFIRMED" &&
              (r.isGroup ? (
                <ValidateGroupDialog
                  reservation={{
                    id: r.id,
                    firstName: r.firstName,
                    customerName: r.customerName,
                    email: r.email,
                    date: new Date(r.date).toISOString().split("T")[0],
                    slot: r.slot,
                    guestCount: r.guestCount,
                  }}
                />
              ) : (
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
              ))}
            {r.status !== "CANCELLED" && (
              <form action={updateReservationStatus}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="status" value="CANCELLED" />
                <Button type="submit" size="sm" variant="destructive" className="h-7 px-2 text-xs">
                  Annuler
                </Button>
              </form>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  // ── Rendu d'une section de service (Midi / Soir / Autre) pour une liste ──
  const renderServiceSection = (slot: Slot, list: Reservation[]) => {
    const meta = SERVICE_META[slot];
    const slotRes = list.filter((r) => r.slot === slot);
    const slotActive = slotRes.filter((r) => r.status !== "CANCELLED");
    const tableCovers = slotActive
      .filter((r) => !r.isGroup)
      .reduce((s, r) => s + r.guestCount, 0);
    const groupList = slotActive.filter((r) => r.isGroup);
    const groupCovers = groupList.reduce((s, r) => s + r.guestCount, 0);
    const totalCovers = tableCovers + groupCovers;
    const slotPending = slotRes.filter((r) => r.isGroup && r.status === "PENDING").length;

    const fillPct = Math.min(100, Math.round((tableCovers / ONLINE_SERVICE_CAP) * 100));
    const over = tableCovers >= ONLINE_SERVICE_CAP;
    const gaugeColor = over
      ? "bg-red-500"
      : tableCovers / ONLINE_SERVICE_CAP >= 0.8
        ? "bg-amber-500"
        : "bg-emerald-500";

    return (
      <section
        key={slot}
        className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
      >
        {/* En-tête de service */}
        <div className={cn("flex flex-wrap items-center justify-between gap-4 border-b p-4", meta.headerClass)}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                meta.iconClass
              )}
            >
              <meta.Icon className="size-5" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-stone-900">{meta.label}</p>
              <p className="text-xs text-stone-500">{meta.time}</p>
            </div>
          </div>

          <div className="min-w-[220px] flex-1 sm:max-w-xs">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold text-stone-800">
                {totalCovers} couvert{totalCovers > 1 ? "s" : ""}
                <span className="ml-1 font-normal text-stone-400">
                  · {slotActive.length} résa
                </span>
              </span>
              <span className={cn("text-xs font-semibold", over ? "text-red-600" : "text-stone-500")}>
                {tableCovers}/{ONLINE_SERVICE_CAP} en ligne
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-stone-200">
              <div
                className={cn("h-full rounded-full transition-all", gaugeColor)}
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px]">
              {groupList.length > 0 && (
                <span className="text-amber-700">
                  {groupList.length} groupe{groupList.length > 1 ? "s" : ""} · {groupCovers}{" "}
                  couv.
                </span>
              )}
              {slotPending > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 font-semibold text-white">
                  {slotPending} à valider
                </span>
              )}
              {over && (
                <span className="font-semibold text-red-600">Quota en ligne atteint</span>
              )}
            </div>
          </div>
        </div>

        {/* Liste des réservations du service */}
        {slotRes.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">
            Aucune réservation à ce service.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50">
                <TableHead className="font-semibold text-stone-700">Client</TableHead>
                <TableHead className="font-semibold text-stone-700">Couverts</TableHead>
                <TableHead className="font-semibold text-stone-700">Espace</TableHead>
                <TableHead className="font-semibold text-stone-700">Contact</TableHead>
                <TableHead className="font-semibold text-stone-700">Statut</TableHead>
                <TableHead className="text-right font-semibold text-stone-700">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{slotRes.map((r) => renderRow(r))}</TableBody>
          </Table>
        )}
      </section>
    );
  };

  // Rend les sections de service d'une liste. showEmptyStandard = affiche Midi/Soir même vides.
  const renderServices = (list: Reservation[], showEmptyStandard: boolean) => {
    const present = new Set(list.map((r) => r.slot));
    const slots = SERVICE_ORDER.filter(
      (s) => present.has(s) || (showEmptyStandard && (s === "LUNCH" || s === "DINNER"))
    );
    return <div className="space-y-6">{slots.map((slot) => renderServiceSection(slot, list))}</div>;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Réservations</h1>
          <p className="mt-1 text-sm capitalize text-stone-500">{dayLabel}</p>
        </div>
        <AddReservationDialog spaces={spaceOptions} />
      </div>

      {/* KPI du jour */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-xs text-stone-500">Couverts attendus</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{totalGuests}</p>
          <p className="mt-0.5 text-[10px] text-stone-400">hors annulés</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-xs text-stone-500">Réservations</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{active.length}</p>
        </div>
        <div
          className={cn(
            "rounded-xl border px-4 py-3",
            pendingGroups.length > 0
              ? "border-amber-300 bg-amber-50"
              : "border-stone-200 bg-white"
          )}
        >
          <p className="text-xs text-stone-500">Groupes à valider</p>
          <p
            className={cn(
              "mt-1 text-2xl font-bold",
              pendingGroups.length > 0 ? "text-amber-700" : "text-stone-900"
            )}
          >
            {pendingGroups.length}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
          <p className="text-xs text-stone-500">Annulées</p>
          <p className="mt-1 text-2xl font-bold text-stone-400">{cancelledCount}</p>
        </div>
      </div>

      {/* Aperçu des 7 prochains jours */}
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-700">
            <CalendarDays className="size-4 text-stone-400" />7 prochains jours
          </h2>
          <p className="text-xs text-stone-500">
            <span className="font-semibold text-stone-800">{weekTotalCount}</span> réservation
            {weekTotalCount > 1 ? "s" : ""} ·{" "}
            <span className="font-semibold text-stone-800">{weekTotalCovers}</span> couverts à venir
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {weekDays.map((d) => {
            const isToday = d.key === todayStr;
            const isSelected = periode === "jour" && params.date === d.key;
            return (
              <Link
                key={d.key}
                href={dayHref(d.key)}
                className={cn(
                  "relative flex flex-col rounded-lg border p-2 transition-colors hover:border-stone-400 hover:bg-stone-50",
                  isSelected
                    ? "border-amber-500 ring-2 ring-amber-300"
                    : isToday
                      ? "border-stone-900 bg-stone-900/5"
                      : "border-stone-200",
                  d.count === 0 && "opacity-60"
                )}
              >
                <span className="text-[10px] font-semibold uppercase text-stone-400">
                  {d.date.toLocaleDateString("fr-FR", { weekday: "short", timeZone: "UTC" })}
                  {isToday && " · auj."}
                </span>
                <span className="text-sm font-bold text-stone-900">
                  {d.date.toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    timeZone: "UTC",
                  })}
                </span>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-bold text-stone-800">{d.covers}</span>
                  <span className="text-[10px] text-stone-400">couv.</span>
                </div>
                <span className="text-[10px] text-stone-400">
                  {d.count} résa{d.count > 1 ? "s" : ""}
                </span>
                {d.pending > 0 && (
                  <span
                    className="absolute right-1.5 top-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-semibold text-white"
                    title={`${d.pending} groupe(s) à valider`}
                  >
                    {d.pending}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bandeau « à valider » - demandes de groupe en attente */}
      {pendingGroups.length > 0 && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600" />
            <h2 className="font-semibold text-amber-900">
              {pendingGroups.length} demande{pendingGroups.length > 1 ? "s" : ""} de groupe à
              valider
            </h2>
          </div>
          <ul className="space-y-2">
            {pendingGroups.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2"
              >
                <div className="text-sm">
                  <span className="font-semibold text-stone-900">
                    {r.firstName} {r.customerName}
                  </span>
                  <span className="text-stone-500">
                    {" "}
                    · {r.guestCount} pers. ·{" "}
                    {new Date(r.date).toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    · {SERVICE_META[r.slot as Slot].label}
                  </span>
                </div>
                <ValidateGroupDialog
                  reservation={{
                    id: r.id,
                    firstName: r.firstName,
                    customerName: r.customerName,
                    email: r.email,
                    date: new Date(r.date).toISOString().split("T")[0],
                    slot: r.slot,
                    guestCount: r.guestCount,
                  }}
                />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-700">
            Ces demandes apparaissent aussi dans leur service ci-dessous.
          </p>
        </div>
      )}

      {/* Filtres */}
      <ReservationFilters
        spaces={spaceOptions}
        currentPeriode={periode}
        currentDate={params.date && params.date !== "all" ? params.date : ""}
        currentFrom={params.from ?? ""}
        currentTo={params.to ?? ""}
        currentType={resType}
        currentSalle={params.salle ?? "all"}
        currentStatut={params.statut ?? "all"}
      />

      {/* Aucun résultat */}
      {reservations.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white py-16 text-center">
          <p className="text-lg font-semibold text-stone-600">
            {isFiltered
              ? "Aucune réservation pour ces critères."
              : "Aucune réservation."}
          </p>
          <p className="mt-1 text-sm text-stone-400">
            Cliquez sur « Nouvelle réservation » pour en créer une.
          </p>
        </div>
      ) : singleDay ? (
        /* Vue d'un seul jour : sections par service (Midi/Soir affichés même vides) */
        renderServices(reservations, true)
      ) : (
        /* Vue multi-jours : regroupée par jour, puis par service */
        <div className="space-y-8">
          {dayGroups.map((g) => {
            const gActive = g.items.filter((r) => r.status !== "CANCELLED");
            const gCovers = gActive.reduce((s, r) => s + r.guestCount, 0);
            const gPending = g.items.filter((r) => r.isGroup && r.status === "PENDING").length;
            const gDate = new Date(`${g.key}T00:00:00Z`);
            const isToday = g.key === todayStr;
            return (
              <div key={g.key} className="space-y-4">
                {/* En-tête du jour */}
                <div className="flex flex-wrap items-center gap-3 border-b-2 border-stone-200 pb-2">
                  <div
                    className={cn(
                      "flex size-11 flex-col items-center justify-center rounded-lg leading-none text-white",
                      isToday ? "bg-amber-600" : "bg-stone-900"
                    )}
                  >
                    <span className="text-[9px] font-medium uppercase">
                      {gDate.toLocaleDateString("fr-FR", { weekday: "short", timeZone: "UTC" })}
                    </span>
                    <span className="text-base font-bold">
                      {gDate.toLocaleDateString("fr-FR", { day: "2-digit", timeZone: "UTC" })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-serif text-base font-bold capitalize text-stone-900">
                      {fmtLong(gDate)}
                      {isToday && (
                        <span className="ml-2 align-middle text-xs font-normal text-amber-600">
                          · aujourd&apos;hui
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-stone-500">
                      {gCovers} couvert{gCovers > 1 ? "s" : ""} · {gActive.length} réservation
                      {gActive.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  {gPending > 0 && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                      {gPending} à valider
                    </span>
                  )}
                </div>

                {renderServices(g.items, false)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SpaceOption = {
  id: string;
  name: string;
  capacity: number;
  isOutdoor: boolean;
};

type Props = {
  spaces: SpaceOption[];
  currentPeriode: string;
  currentDate: string; // jour précis (YYYY-MM-DD) ou ""
  currentFrom: string;
  currentTo: string;
  currentType: string; // all | group | solo
  currentSalle: string;
  currentStatut: string;
};

export function ReservationFilters({
  spaces,
  currentPeriode,
  currentDate,
  currentFrom,
  currentTo,
  currentType,
  currentSalle,
  currentStatut,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const base: Record<string, string> = {
        periode: currentPeriode,
        date: currentDate,
        from: currentFrom,
        to: currentTo,
        type: currentType,
        salle: currentSalle,
        statut: currentStatut,
        ...overrides,
      };
      const next = new URLSearchParams();
      for (const [k, v] of Object.entries(base)) {
        // On omet les valeurs par défaut pour garder des URLs propres
        if (!v || v === "all" || v === "a_venir") continue;
        next.set(k, v);
      }
      const qs = next.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname, currentPeriode, currentDate, currentFrom, currentTo, currentType, currentSalle, currentStatut]
  );

  const chip =
    "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors select-none";
  const active = "border-stone-900 bg-stone-900 text-white";
  const inactive =
    "border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-900";

  const periodes = [
    { value: "a_venir", label: "À venir" },
    { value: "today", label: "Aujourd'hui" },
    { value: "tomorrow", label: "Demain" },
    { value: "semaine", label: "Cette semaine" },
    { value: "passees", label: "Passées" },
    { value: "toutes", label: "Toutes" },
  ];

  const types = [
    { value: "all", label: "Toutes" },
    { value: "solo", label: "Individuelles" },
    { value: "group", label: "Groupes" },
  ];

  return (
    <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      {/* Ligne 1 : période */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-16 shrink-0 text-xs font-semibold uppercase text-stone-400">
          Période
        </span>

        <div className="flex flex-wrap gap-2">
          {periodes.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() =>
                router.push(buildUrl({ periode: p.value, date: "", from: "", to: "" }))
              }
              className={cn(chip, currentPeriode === p.value ? active : inactive)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Jour précis */}
        <div className="flex items-center gap-2">
          <Label htmlFor="date-picker" className="text-xs text-stone-400">
            Jour
          </Label>
          <Input
            id="date-picker"
            type="date"
            className={cn(
              "h-8 w-40 text-xs",
              currentPeriode === "jour" && "border-amber-400 ring-1 ring-amber-300"
            )}
            value={currentPeriode === "jour" ? currentDate : ""}
            onChange={(e) => {
              if (e.target.value) {
                router.push(
                  buildUrl({ periode: "jour", date: e.target.value, from: "", to: "" })
                );
              } else {
                router.push(buildUrl({ periode: "a_venir", date: "" }));
              }
            }}
          />
        </div>
      </div>

      {/* Ligne 2 : plage de dates */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-16 shrink-0 text-xs font-semibold uppercase text-stone-400">
          Plage
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="from-picker" className="text-xs text-stone-400">
            Du
          </Label>
          <Input
            id="from-picker"
            type="date"
            className={cn(
              "h-8 w-40 text-xs",
              currentPeriode === "plage" && "border-amber-400 ring-1 ring-amber-300"
            )}
            value={currentPeriode === "plage" ? currentFrom : ""}
            onChange={(e) =>
              router.push(buildUrl({ periode: "plage", from: e.target.value, date: "" }))
            }
          />
          <Label htmlFor="to-picker" className="text-xs text-stone-400">
            au
          </Label>
          <Input
            id="to-picker"
            type="date"
            className={cn(
              "h-8 w-40 text-xs",
              currentPeriode === "plage" && "border-amber-400 ring-1 ring-amber-300"
            )}
            value={currentPeriode === "plage" ? currentTo : ""}
            onChange={(e) =>
              router.push(buildUrl({ periode: "plage", to: e.target.value, date: "" }))
            }
          />
          {currentPeriode === "plage" && (
            <button
              type="button"
              onClick={() => router.push(buildUrl({ periode: "a_venir", from: "", to: "" }))}
              className="text-xs text-stone-400 hover:text-red-500"
              title="Effacer la plage"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Ligne 3 : type */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-16 shrink-0 text-xs font-semibold uppercase text-stone-400">
          Type
        </span>
        {types.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => router.push(buildUrl({ type: t.value }))}
            className={cn(chip, currentType === t.value ? active : inactive)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Ligne 4 : salle */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-16 shrink-0 text-xs font-semibold uppercase text-stone-400">
          Salle
        </span>
        <button
          type="button"
          onClick={() => router.push(buildUrl({ salle: "all" }))}
          className={cn(chip, currentSalle === "all" ? active : inactive)}
        >
          Toutes
        </button>
        {spaces.map((space) => (
          <button
            key={space.id}
            type="button"
            onClick={() => router.push(buildUrl({ salle: space.id }))}
            className={cn(chip, currentSalle === space.id ? active : inactive)}
          >
            {space.name}
          </button>
        ))}
      </div>

      {/* Ligne 5 : statut */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-16 shrink-0 text-xs font-semibold uppercase text-stone-400">
          Statut
        </span>
        {[
          { value: "all", label: "Tous" },
          { value: "CONFIRMED", label: "Confirmées" },
          { value: "PENDING", label: "En attente" },
          { value: "CANCELLED", label: "Annulées" },
        ].map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => router.push(buildUrl({ statut: s.value }))}
            className={cn(chip, currentStatut === s.value ? active : inactive)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

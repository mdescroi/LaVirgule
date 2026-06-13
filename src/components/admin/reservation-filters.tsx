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
  currentDate: string;
  currentSalle: string;
  currentStatut: string;
};

export function ReservationFilters({
  spaces,
  currentDate,
  currentSalle,
  currentStatut,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const buildUrl = useCallback(
    (overrides: Record<string, string>) => {
      const next = new URLSearchParams({
        date: currentDate,
        salle: currentSalle,
        statut: currentStatut,
        ...overrides,
      });
      return `${pathname}?${next.toString()}`;
    },
    [pathname, currentDate, currentSalle, currentStatut]
  );

  const chip =
    "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors select-none";
  const active = "border-stone-900 bg-stone-900 text-white";
  const inactive =
    "border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-900";

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1))
    .toISOString()
    .split("T")[0];

  return (
    <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      {/* Ligne 1 : date */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-16 shrink-0 text-xs font-semibold uppercase text-stone-400">
          Date
        </span>

        {/* Raccourcis */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Toutes", value: "all" },
            { label: "Aujourd'hui", value: today },
            { label: "Demain", value: tomorrow },
          ].map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => router.push(buildUrl({ date: p.value }))}
              className={cn(chip, currentDate === p.value ? active : inactive)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Sélecteur calendaire */}
        <div className="flex items-center gap-2">
          <Label htmlFor="date-picker" className="sr-only">
            Choisir une date
          </Label>
          <Input
            id="date-picker"
            type="date"
            className="h-8 w-40 text-xs"
            value={currentDate !== "all" ? currentDate : ""}
            onChange={(e) => {
              if (e.target.value) {
                router.push(buildUrl({ date: e.target.value }));
              } else {
                router.push(buildUrl({ date: "all" }));
              }
            }}
          />
          {currentDate !== "all" && (
            <button
              type="button"
              onClick={() => router.push(buildUrl({ date: "all" }))}
              className="text-xs text-stone-400 hover:text-red-500"
              title="Effacer le filtre de date"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Ligne 2 : salle */}
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

      {/* Ligne 3 : statut */}
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

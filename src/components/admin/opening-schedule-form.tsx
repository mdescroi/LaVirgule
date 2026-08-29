"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateOpeningSchedule } from "@/app/actions/admin";
import { WEEKDAYS_DISPLAY_ORDER, type OpeningRow } from "@/lib/opening-schedule";

export function OpeningScheduleForm({ schedule }: { schedule: OpeningRow[] }) {
  const [isPending, startTransition] = useTransition();
  const byDay = new Map(schedule.map((r) => [r.dayOfWeek, r]));

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateOpeningSchedule(formData);
      if (result.success) {
        toast.success("Planning d'ouverture mis à jour.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="overflow-x-auto rounded-lg border border-stone-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-left text-stone-500">
              <th className="px-4 py-3 font-medium">Jour</th>
              <th className="px-4 py-3 font-medium">Service du midi</th>
              <th className="px-4 py-3 font-medium">Service du soir</th>
            </tr>
          </thead>
          <tbody>
            {WEEKDAYS_DISPLAY_ORDER.map(({ dayOfWeek, label }) => {
              const row = byDay.get(dayOfWeek);
              return (
                <tr key={dayOfWeek} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-stone-900">{label}</td>
                  <td className="px-4 py-3">
                    <Label className="flex w-fit items-center gap-2">
                      <Switch
                        name={`lunch_${dayOfWeek}`}
                        defaultChecked={row?.lunchOpen ?? true}
                      />
                      <span className="text-stone-500">
                        {(row?.lunchOpen ?? true) ? "Ouvert" : "Fermé"}
                      </span>
                    </Label>
                  </td>
                  <td className="px-4 py-3">
                    <Label className="flex w-fit items-center gap-2">
                      <Switch
                        name={`dinner_${dayOfWeek}`}
                        defaultChecked={row?.dinnerOpen ?? true}
                      />
                      <span className="text-stone-500">
                        {(row?.dinnerOpen ?? true) ? "Ouvert" : "Fermé"}
                      </span>
                    </Label>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Ce planning est le mode par défaut du site public.</p>
        <p className="mt-1 text-stone-600">
          Un service marqué « Fermé » bloque automatiquement les nouvelles réservations de table en ligne pour ce jour et ce service. Les demandes de groupe restent toujours possibles (elles sont validées à la main).
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="gap-2 bg-stone-900 text-white hover:bg-stone-800"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Enregistrer le planning
      </Button>
    </form>
  );
}

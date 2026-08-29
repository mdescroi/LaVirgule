import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OpeningScheduleForm } from "@/components/admin/opening-schedule-form";
import { getWeeklyOpeningHours } from "@/lib/opening-schedule";
import { RESERVATION_WINDOW_DAYS } from "@/lib/config";
import { CalendarClock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPlanningOuverturePage() {
  const schedule = await getWeeklyOpeningHours();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Planning d&apos;ouverture
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Définissez, service par service, les jours où le restaurant est ouvert. Ce planning par défaut contrôle les réservations en ligne.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4 text-amber-600" />
            Ouverture hebdomadaire par défaut
          </CardTitle>
          <CardDescription>
            Les réservations de table en ligne ne sont ouvertes que sur les {RESERVATION_WINDOW_DAYS} prochains jours, et uniquement pour les services marqués « Ouvert » ci-dessous.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OpeningScheduleForm schedule={schedule} />
        </CardContent>
      </Card>
    </div>
  );
}

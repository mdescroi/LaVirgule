import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoursForm } from "@/components/admin/hours-form";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

const DEFAULT_SETTINGS = {
  hoursLine1: "Service du midi de 12h à 14h.",
  hoursLine2: "Service du soir de 19h à 21h",
  hoursLine3: "Du Lundi au Vendredi",
};

export default async function AdminHorairesPage() {
  const settings = await prisma.siteSettings
    .findUnique({ where: { id: "singleton" } })
    .catch(() => null);

  const data = settings ?? DEFAULT_SETTINGS;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Horaires d&apos;ouverture
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Modifiez les horaires affichés sur le site. Les changements sont publiés immédiatement.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Formulaire */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-4 text-amber-600" />
                Modifier les horaires
              </CardTitle>
              <CardDescription>
                Renseignez vos horaires sous forme de lignes de texte libres. Chaque ligne correspond à une période ou une règle distincte.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HoursForm
                settings={{
                  hoursLine1: data.hoursLine1,
                  hoursLine2: data.hoursLine2,
                  hoursLine3: data.hoursLine3,
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Aperçu actuel */}
        <div className="space-y-4">
          <Card className="shadow-sm border-stone-200">
            <CardHeader>
              <CardTitle className="text-base">Aperçu actuel</CardTitle>
              <CardDescription>
                Tel qu&apos;affiché sur le site en ce moment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[data.hoursLine1, data.hoursLine2, data.hoursLine3]
                  .filter(Boolean)
                  .map((line, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm text-stone-600 leading-relaxed"
                    >
                      <Clock className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                      {line}
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-stone-200 bg-stone-50 shadow-sm">
            <CardContent className="pt-5">
              <p className="text-xs text-stone-500 leading-relaxed">
                <strong className="text-stone-700">Conseil :</strong> Utilisez le tiret demi-cadratin (–) pour les plages horaires (ex : 12h–14h) et le point médian (·) pour séparer les infos sur une même ligne.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

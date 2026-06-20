import { prisma } from "@/lib/prisma";
import { EventFormDialog } from "@/components/admin/event-form-dialog";
import { EventRow } from "@/components/admin/event-row";

export const dynamic = "force-dynamic";

export default async function AdminEvenementsPage() {
  const now = new Date();

  const [upcoming, past] = await Promise.all([
    prisma.event.findMany({
      where: { date: { gte: now } },
      orderBy: { date: "asc" },
    }),
    prisma.event.findMany({
      where: { date: { lt: now } },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-stone-900">Événements</h1>
          <p className="mt-1 text-sm text-stone-500">
            Gérez les événements et soirées affichés sur le site.
          </p>
        </div>
        <EventFormDialog />
      </div>

      {/* À venir */}
      <section>
        <h2 className="mb-4 font-serif text-lg font-semibold text-stone-700 border-b border-stone-200 pb-2">
          À venir ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <p className="rounded-xl border border-dashed border-stone-300 py-10 text-center text-sm text-stone-400">
            Aucun événement à venir. Créez-en un avec le bouton ci-dessus.
          </p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((ev) => (
              <EventRow key={ev.id} event={ev} />
            ))}
          </ul>
        )}
      </section>

      {/* Passés */}
      {past.length > 0 && (
        <section>
          <h2 className="mb-4 font-serif text-lg font-semibold text-stone-400 border-b border-stone-100 pb-2">
            Passés (20 derniers)
          </h2>
          <ul className="space-y-3 opacity-60">
            {past.map((ev) => (
              <EventRow key={ev.id} event={ev} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}



"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventFormDialog } from "@/components/admin/event-form-dialog";
import { deleteEvent, toggleEventPublished } from "@/app/actions/admin";
import { CalendarDays, MapPin, Eye, EyeOff, Trash2 } from "lucide-react";

function formatEventDate(date: Date, endDate: Date | null): string {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  const start = new Intl.DateTimeFormat("fr-FR", opts).format(date);
  if (!endDate) return start;
  const end = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(endDate);
  return `${start} → ${end}`;
}

type EventRowProps = {
  event: {
    id: string;
    title: string;
    description: string;
    date: Date;
    endDate: Date | null;
    location: string | null;
    imageUrl: string | null;
    isPublished: boolean;
  };
};

export function EventRow({ event }: EventRowProps) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-stone-900">{event.title}</span>
          {event.isPublished ? (
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Publié</Badge>
          ) : (
            <Badge className="bg-stone-100 text-stone-500 hover:bg-stone-100">Masqué</Badge>
          )}
        </div>

        <div className="mt-1.5 flex flex-col gap-1 text-sm text-stone-500">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0 text-amber-500" />
            {formatEventDate(event.date, event.endDate)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0 text-amber-500" />
              {event.location}
            </span>
          )}
        </div>

        <p className="mt-2 line-clamp-2 text-sm text-stone-600">{event.description}</p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <EventFormDialog event={event} />

        <form action={toggleEventPublished}>
          <input type="hidden" name="id" value={event.id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            title={event.isPublished ? "Masquer" : "Publier"}
            className="text-stone-500 hover:text-stone-900"
          >
            {event.isPublished ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </form>

        <form
          action={deleteEvent}
          onSubmit={(e) => {
            if (!confirm("Supprimer cet événement ?")) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={event.id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-600"
          >
            <Trash2 className="size-4" />
          </Button>
        </form>
      </div>
    </li>
  );
}

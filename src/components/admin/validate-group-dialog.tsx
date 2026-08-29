"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Mail, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { confirmGroupReservation } from "@/app/actions/reservation";
import { RESTAURANT, SERVICE_SLOTS } from "@/lib/config";

export type GroupReservationSummary = {
  id: string;
  firstName: string;
  customerName: string;
  email: string;
  date: string; // YYYY-MM-DD
  slot: "LUNCH" | "DINNER" | "OTHER";
  guestCount: number;
};

function slotLabel(slot: string): string {
  return SERVICE_SLOTS.find((s) => s.value === slot)?.label ?? slot;
}

function dateLabel(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function defaultSubject(): string {
  return `Confirmation de votre réservation de groupe - ${RESTAURANT.name}`;
}

function defaultBody(r: GroupReservationSummary): string {
  return [
    `Bonjour ${r.firstName},`,
    "",
    `Nous avons le plaisir de vous confirmer votre réservation de groupe à ${RESTAURANT.name}.`,
    "",
    `Date : ${dateLabel(r.date)}`,
    `Service : ${slotLabel(r.slot)}`,
    `Nombre de personnes : ${r.guestCount}`,
    "",
    `Nous vous accueillerons avec grand plaisir. N'hésitez pas à nous préciser vos éventuelles demandes particulières (menu, allergies, disposition…).`,
    "",
    `Pour toute question, appelez-nous au ${RESTAURANT.phone}.`,
    "",
    `À très bientôt,`,
    `L'équipe de ${RESTAURANT.name}`,
  ].join("\n");
}

export function ValidateGroupDialog({
  reservation,
}: {
  reservation: GroupReservationSummary;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState(defaultSubject());
  const [body, setBody] = useState(defaultBody(reservation));

  function resetTemplate() {
    setSubject(defaultSubject());
    setBody(defaultBody(reservation));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  
  startTransition(async () => {
    const result = await confirmGroupReservation(formData);
      if (result.success) {
        if (result.warning) {
          toast.warning(result.warning, { duration: 8000 });
        } else {
          // Le message change selon ce que ton action renvoie
          toast.success(result.message || "Opération réussie.");
        }
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          className="h-7 bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-500"
        >
          Valider
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-4 text-emerald-600" />
            Confirmer la réservation de groupe
          </DialogTitle>
          <p className="text-sm text-stone-500">
            {reservation.firstName} {reservation.customerName} · {reservation.guestCount} pers. ·{" "}
            {dateLabel(reservation.date)}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <input type="hidden" name="id" value={reservation.id} />

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <p>
              <strong>Confirmer et envoyer</strong> passe la réservation en «&nbsp;Confirmée&nbsp;»
              et envoie l&apos;email ci-dessous au client.
            </p>
            <p className="mt-1">
              <strong>Confirmer sans email</strong> met seulement à jour le statut en base - utile
              pour une réservation que vous avez saisie vous-même.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vg-to">Destinataire</Label>
            <Input id="vg-to" value={reservation.email} readOnly disabled className="bg-stone-50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vg-subject">Objet du mail *</Label>
            <Input
              id="vg-subject"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="vg-body">Corps du mail *</Label>
              <button
                type="button"
                onClick={resetTemplate}
                className="flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-800"
              >
                <RotateCcw className="size-3" />
                Réinitialiser le modèle
              </button>
            </div>
            <Textarea
              id="vg-body"
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="font-mono text-sm leading-relaxed"
            />
            <p className="text-xs text-stone-400">
              Vous pouvez modifier librement le texte avant l&apos;envoi.
            </p>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              name="mode"
              value="silent"
              disabled={isPending}
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Confirmer sans email
            </Button>
            <Button
              type="submit"
              name="mode"
              value="email"
              disabled={isPending}
              className="bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              Confirmer et envoyer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

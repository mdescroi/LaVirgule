"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Lock, Pencil } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateReservationAdmin } from "@/app/actions/admin";
import { SERVICE_SLOTS } from "@/lib/config";

type SpaceOption = {
  id: string;
  name: string;
  capacity: number;
  isOutdoor: boolean;
};

export type ReservationData = {
  id: string;
  firstName: string;
  customerName: string;
  email: string;
  phone: string;
  date: string; // YYYY-MM-DD
  slot: "LUNCH" | "DINNER" | "OTHER";
  guestCount: number;
  spaceId: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  message: string | null;
  isGroup?: boolean;
};

export function EditReservationDialog({
  reservation,
  spaces,
}: {
  reservation: ReservationData;
  spaces: SpaceOption[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateReservationAdmin(formData);
      if (result.success) {
        if (result.warning) {
          toast.warning(result.warning, { duration: 8000 });
        } else {
          toast.success("Réservation modifiée.");
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
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-stone-600 hover:text-stone-900"
          aria-label={`Modifier la réservation de ${reservation.firstName} ${reservation.customerName}`}
        >
          <Pencil className="size-3.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-4 text-amber-600" />
            Modifier la réservation
          </DialogTitle>
          <p className="text-sm text-stone-500">
            {reservation.firstName} {reservation.customerName}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-4">
          <input type="hidden" name="id" value={reservation.id} />

          {/* Alerte groupe en attente */}
          {reservation.isGroup && reservation.status === "PENDING" && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">Groupe en attente de validation</p>
                <p className="text-xs mt-0.5">
                  Assignez une salle avant de passer le statut à « Confirmée » — cela privatisera
                  automatiquement la salle pour ce créneau.
                </p>
              </div>
            </div>
          )}

          {/* Indicateur salle privatisée */}
          {reservation.isGroup && reservation.status === "CONFIRMED" && reservation.spaceId && (
            <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900">
              <Lock className="size-4 shrink-0 text-violet-600" />
              <p>
                <span className="font-semibold">Salle privatisée.</span> Modifier l&apos;espace
                ou annuler la réservation libérera ce créneau.
              </p>
            </div>
          )}

          {/* Identité */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="er-firstName">Prénom *</Label>
              <Input
                id="er-firstName"
                name="firstName"
                required
                maxLength={80}
                defaultValue={reservation.firstName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="er-name">Nom *</Label>
              <Input
                id="er-name"
                name="customerName"
                required
                maxLength={80}
                defaultValue={reservation.customerName}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="er-phone">Téléphone *</Label>
              <Input
                id="er-phone"
                name="phone"
                type="tel"
                required
                defaultValue={reservation.phone}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="er-email">Email</Label>
              <Input
                id="er-email"
                name="email"
                type="email"
                defaultValue={reservation.email}
                placeholder="(facultatif)"
              />
            </div>
          </div>

          {/* Date / créneau / couverts */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="er-date">Date *</Label>
              <Input
                id="er-date"
                name="date"
                type="date"
                required
                defaultValue={reservation.date}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="er-slot">Service *</Label>
              <Select name="slot" defaultValue={reservation.slot}>
                <SelectTrigger id="er-slot" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_SLOTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="er-guests">Couverts *</Label>
              <Input
                id="er-guests"
                name="guestCount"
                type="number"
                min={1}
                max={200}
                required
                defaultValue={reservation.guestCount}
              />
            </div>
          </div>

          {/* Salle */}
          <div className="space-y-2">
            <Label htmlFor="er-space">Espace</Label>
            <Select name="spaceId" defaultValue={reservation.spaceId ?? "any"}>
              <SelectTrigger id="er-space" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Peu importe</SelectItem>
                {spaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name} — {space.isOutdoor ? "Extérieur" : "Intérieur"} (max{" "}
                    {space.capacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label htmlFor="er-status">Statut</Label>
            <Select name="status" defaultValue={reservation.status}>
              <SelectTrigger id="er-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONFIRMED">Confirmée</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="CANCELLED">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Note interne */}
          <div className="space-y-2">
            <Label htmlFor="er-message">Note interne</Label>
            <Textarea
              id="er-message"
              name="message"
              rows={3}
              maxLength={2000}
              defaultValue={reservation.message ?? ""}
              placeholder="Allergies, occasion spéciale…"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-stone-900 text-white hover:bg-stone-800"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

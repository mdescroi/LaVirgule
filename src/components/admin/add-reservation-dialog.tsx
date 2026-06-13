"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Lock, Phone, Plus, Users } from "lucide-react";
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
import { createReservationAdmin } from "@/app/actions/admin";
import { SERVICE_SLOTS, RESTAURANT } from "@/lib/config";
import { cn } from "@/lib/utils";

type SpaceOption = {
  id: string;
  name: string;
  capacity: number;
  isOutdoor: boolean;
};

export function AddReservationDialog({ spaces }: { spaces: SpaceOption[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isGroup, setIsGroup] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) setIsGroup(false);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("isGroup", isGroup ? "1" : "0");
    startTransition(async () => {
      const result = await createReservationAdmin(formData);
      if (result.success) {
        toast.success(isGroup ? "Demande de groupe enregistrée." : "Réservation enregistrée.");
        handleOpenChange(false);
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-stone-900 text-white hover:bg-stone-800">
          <Plus className="size-4" /> Nouvelle réservation
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="size-4 text-amber-600" />
            Ajouter une réservation manuelle
          </DialogTitle>
          <p className="text-sm text-stone-500">
            Pour les réservations prises par téléphone.
          </p>
        </DialogHeader>

        {/* Switcher type */}
        <div className="grid grid-cols-2 gap-2 rounded-xl border border-stone-200 bg-stone-50 p-1.5">
          <button
            type="button"
            onClick={() => setIsGroup(false)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              !isGroup
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            <Users className="size-3.5" />
            Table classique
          </button>
          <button
            type="button"
            onClick={() => setIsGroup(true)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              isGroup
                ? "bg-amber-500 text-stone-950 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            <Lock className="size-3.5" />
            Groupe / Événement
          </button>
        </div>

        {/* Bandeau info groupe */}
        {isGroup && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">Réservation de groupe</p>
              <p className="mt-0.5 text-xs">
                Minimum {RESTAURANT.groupThreshold} personnes. Si vous assignez une salle et
                passez le statut à « Confirmée », celle-ci sera automatiquement privatisée pour
                ce créneau.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identité */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ar-firstName">Prénom *</Label>
              <Input id="ar-firstName" name="firstName" required maxLength={80} placeholder="Jean" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-name">Nom *</Label>
              <Input id="ar-name" name="customerName" required maxLength={80} placeholder="Dupont" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ar-phone">Téléphone *</Label>
              <Input id="ar-phone" name="phone" type="tel" required placeholder="06 00 00 00 00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-email">Email</Label>
              <Input id="ar-email" name="email" type="email" placeholder="(facultatif)" />
            </div>
          </div>

          {/* Date / créneau / couverts */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ar-date">Date *</Label>
              <Input id="ar-date" name="date" type="date" required defaultValue={today} min={today} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-slot">Service *</Label>
              <Select name="slot" defaultValue="LUNCH">
                <SelectTrigger id="ar-slot" className="w-full">
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
              <Label htmlFor="ar-guests">Couverts *</Label>
              <Input
                id="ar-guests"
                name="guestCount"
                type="number"
                min={isGroup ? RESTAURANT.groupThreshold : 1}
                max={200}
                required
                defaultValue={isGroup ? RESTAURANT.groupThreshold : 2}
                key={isGroup ? "group" : "table"}
              />
            </div>
          </div>

          {/* Salle */}
          <div className="space-y-2">
            <Label htmlFor="ar-space">
              {isGroup ? "Salle à privatiser" : "Espace"}
              {isGroup && <span className="ml-1.5 text-xs font-normal text-stone-400">(optionnel — à confirmer après devis)</span>}
            </Label>
            <Select name="spaceId" defaultValue="any">
              <SelectTrigger id="ar-space" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{isGroup ? "À définir" : "Peu importe"}</SelectItem>
                {spaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name} — {space.isOutdoor ? "Ext." : "Int."} (max {space.capacity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label htmlFor="ar-status">Statut</Label>
            <Select name="status" defaultValue={isGroup ? "PENDING" : "CONFIRMED"} key={isGroup ? "g-status" : "t-status"}>
              <SelectTrigger id="ar-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONFIRMED">Confirmée</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="CANCELLED">Annulée</SelectItem>
              </SelectContent>
            </Select>
            {isGroup && (
              <p className="text-xs text-stone-400">
                Les demandes de groupe commencent en « En attente » jusqu&apos;au retour du devis.
              </p>
            )}
          </div>

          {/* Note interne */}
          <div className="space-y-2">
            <Label htmlFor="ar-message">Note interne</Label>
            <Textarea
              id="ar-message"
              name="message"
              rows={3}
              maxLength={2000}
              placeholder={
                isGroup
                  ? "Type d'événement, menu souhaité, contraintes particulières…"
                  : "Allergies, demande particulière, occasion spéciale…"
              }
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={cn(
                "text-white",
                isGroup
                  ? "bg-amber-600 hover:bg-amber-500"
                  : "bg-stone-900 hover:bg-stone-800"
              )}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isGroup ? "Enregistrer la demande" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Briefcase, CalendarCheck, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { createReservation } from "@/app/actions/reservation";
import { RESTAURANT, SERVICE_SLOTS } from "@/lib/config";
import { cn } from "@/lib/utils";

type SpaceOption = {
  id: string;
  name: string;
  capacity: number;
  isOutdoor: boolean;
};

type SuccessState = { isGroup: boolean } | null;

export function ReservationForm({ spaces }: { spaces: SpaceOption[] }) {
  const searchParams = useSearchParams();
  const initialGroup = searchParams.get("groupe") === "1";

  const [guestCount, setGuestCount] = useState<number>(initialGroup ? 15 : 2);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<SuccessState>(null);

  const isGroupMode = useMemo(
    () => guestCount >= RESTAURANT.groupThreshold,
    [guestCount]
  );

  const today = new Date().toISOString().split("T")[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createReservation(formData);
      if (result.success) {
        setSuccess({ isGroup: result.isGroup });
      } else {
        toast.error(result.error);
      }
    });
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "rounded-2xl border p-10 text-center",
          success.isGroup
            ? "border-amber-300 bg-amber-50"
            : "border-emerald-200 bg-emerald-50"
        )}
      >
        {success.isGroup ? (
          <>
            <Briefcase className="mx-auto size-12 text-amber-600" />
            <h2 className="mt-4 font-serif text-2xl font-bold text-amber-900">
              Demande de privatisation envoyée !
            </h2>
            <p className="mt-3 text-amber-800">
              Votre demande de devis groupe a bien été enregistrée. Notre équipe
              vous recontactera très rapidement pour organiser votre événement.
            </p>
          </>
        ) : (
          <>
            <CalendarCheck className="mx-auto size-12 text-emerald-600" />
            <h2 className="mt-4 font-serif text-2xl font-bold text-emerald-900">
              Réservation confirmée !
            </h2>
            <p className="mt-3 text-emerald-800">
              Votre table est réservée. Nous nous réjouissons de vous accueillir
              à La Virgule !
            </p>
          </>
        )}
        <p className="mt-4 text-sm text-stone-500">
          Une question ? Appelez-nous au {RESTAURANT.phone}.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Bandeau dynamique B2B */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isGroupMode ? "group" : "standard"}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "flex items-center gap-3 rounded-xl border p-4",
            isGroupMode
              ? "border-amber-300 bg-amber-50 text-amber-900"
              : "border-stone-200 bg-stone-50 text-stone-700"
          )}
        >
          {isGroupMode ? (
            <>
              <Briefcase className="size-6 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">
                  Mode Demande de privatisation / Devis Groupe
                </p>
                <p className="text-sm">
                  À partir de {RESTAURANT.groupThreshold} personnes, votre demande
                  est étudiée par notre équipe qui vous recontacte avec une
                  proposition sur mesure.
                </p>
              </div>
            </>
          ) : (
            <>
              <Users className="size-6 shrink-0 text-stone-500" />
              <div>
                <p className="font-semibold">Réservation classique</p>
                <p className="text-sm">
                  Confirmation immédiate pour les tables de moins de{" "}
                  {RESTAURANT.groupThreshold} personnes.
                </p>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Identité */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom *</Label>
          <Input id="firstName" name="firstName" required maxLength={80} placeholder="Jean" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerName">Nom *</Label>
          <Input id="customerName" name="customerName" required maxLength={80} placeholder="Dupont" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone *</Label>
          <Input id="phone" name="phone" type="tel" required placeholder="06 00 00 00 00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" name="email" type="email" required placeholder="vous@exemple.fr" />
        </div>
      </div>

      {/* Date / heure / couverts */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input id="date" name="date" type="date" required min={today} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slot">Service *</Label>
          <Select name="slot" defaultValue="LUNCH" required>
            <SelectTrigger id="slot" className="w-full">
              <SelectValue placeholder="Choisir un créneau" />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_SLOTS.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="guestCount">Nombre de personnes *</Label>
          <Input
            id="guestCount"
            name="guestCount"
            type="number"
            min={1}
            max={200}
            required
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value) || 1)}
          />
        </div>
      </div>

      {/* Espace */}
      <div className="space-y-2">
        <Label htmlFor="spaceId">Espace souhaité</Label>
        <Select name="spaceId" defaultValue="any">
          <SelectTrigger id="spaceId" className="w-full">
            <SelectValue placeholder="Peu importe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Peu importe</SelectItem>
            {spaces.map((space) => (
              <SelectItem key={space.id} value={space.id}>
                {space.name} — {space.isOutdoor ? "Extérieur" : "Intérieur"} (max{" "}
                {space.capacity} pers.)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Message (mis en avant en mode groupe) */}
      <AnimatePresence>
        {isGroupMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2 overflow-hidden"
          >
            <Label htmlFor="message">
              Précisions sur votre événement (entreprise, occasion, besoins…)
            </Label>
            <Textarea
              id="message"
              name="message"
              rows={4}
              maxLength={2000}
              placeholder="Séminaire d'entreprise de 25 personnes, besoin d'un vidéoprojecteur…"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        type="submit"
        disabled={isPending}
        size="lg"
        className={cn(
          "w-full text-base font-semibold",
          isGroupMode
            ? "bg-stone-900 text-white hover:bg-stone-800"
            : "bg-amber-500 text-stone-950 hover:bg-amber-400"
        )}
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {isGroupMode
          ? "Envoyer ma demande de devis groupe"
          : "Confirmer ma réservation"}
      </Button>
    </form>
  );
}

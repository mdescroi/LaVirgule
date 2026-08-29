"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Briefcase,
  CalendarCheck,
  Loader2,
  Lock,
  PhoneCall,
  Users,
} from "lucide-react";
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
import { RESTAURANT, SERVICE_SLOTS, RESERVATION_WINDOW_DAYS } from "@/lib/config";
import { cn } from "@/lib/utils";

type Props = {
  initialMode?: "table" | "group";
};

type SuccessState = { mode: "table" | "group" } | null;

// ─────────────────────────── Écran de succès ───────────────────────────

function SuccessScreen({ mode }: { mode: "table" | "group" }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-2xl border p-10 text-center",
        mode === "group" ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50"
      )}
    >
      {mode === "group" ? (
        <>
          <Briefcase className="mx-auto size-12 text-amber-600" />
          <h2 className="mt-4 font-serif text-2xl font-bold text-amber-900">
            Demande envoyée !
          </h2>
          <p className="mt-3 text-amber-800">
            Votre demande de groupe a bien été enregistrée. Notre équipe vous
            recontactera dans les meilleurs délais pour établir le devis et
            confirmer l&apos;organisation.
          </p>
          <p className="mt-3 text-sm text-amber-700 font-medium">
            Aucune salle n&apos;est réservée à ce stade - tout se confirme après
            notre appel.
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
      <p className="mt-5 text-sm text-stone-500">
        Une question ? Appelez-nous au{" "}
        <a href={RESTAURANT.phoneHref} className="font-medium text-amber-700 hover:underline">
          {RESTAURANT.phone}
        </a>
      </p>
    </motion.div>
  );
}

// ─────────────────────────── Formulaire table classique ────────────────

function TableForm({ onSuccess }: { onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [serviceFull, setServiceFull] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + RESERVATION_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServiceFull(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createReservation(fd);
      if (result.success) {
        onSuccess();
      } else if (result.code === "SERVICE_FULL") {
        setServiceFull(result.error);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Alerte « service complet en ligne » - bien visible + incitation à appeler */}
      {serviceFull && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 shadow-sm"
        >
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
              <PhoneCall className="size-6" />
            </div>
            <div className="flex-1">
              <p className="font-serif text-xl font-bold text-amber-900">
                Réservation en ligne complète pour ce service
              </p>
              <p className="mt-1 text-sm font-medium text-amber-800">{serviceFull}</p>
              <p className="mt-2 text-sm text-amber-800">
                Les réservations en ligne sont volontairement limitées. Il reste très
                probablement de la place&nbsp;: appelez-nous, vous avez de{" "}
                <strong>grandes chances de pouvoir réserver</strong>.
              </p>
              <a
                href={RESTAURANT.phoneHref}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-lg font-bold text-stone-950 shadow transition-colors hover:bg-amber-400"
              >
                <PhoneCall className="size-5" />
                Appeler le {RESTAURANT.phone}
              </a>
              <p className="mt-2 text-xs text-amber-700">
                Vous pouvez aussi tenter une autre date ou un autre service ci-dessous.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="t-firstName">Prénom *</Label>
          <Input id="t-firstName" name="firstName" required maxLength={80} placeholder="Jean" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-name">Nom *</Label>
          <Input id="t-name" name="customerName" required maxLength={80} placeholder="Dupont" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="t-phone">Téléphone *</Label>
          <Input id="t-phone" name="phone" type="tel" required placeholder="06 00 00 00 00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-email">Email *</Label>
          <Input id="t-email" name="email" type="email" required placeholder="vous@exemple.fr" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="t-date">Date *</Label>
          <Input id="t-date" name="date" type="date" required min={today} max={maxDate} />
          <p className="text-xs text-stone-400">Jusqu&apos;à {RESERVATION_WINDOW_DAYS} jours à l&apos;avance.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-slot">Service *</Label>
          <Select name="slot" defaultValue="LUNCH" required>
            <SelectTrigger id="t-slot" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_SLOTS.filter((s) => s.value !== "OTHER").map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="t-guests">Couverts *</Label>
          <Input
            id="t-guests"
            name="guestCount"
            type="number"
            min={1}
            max={RESTAURANT.groupThreshold - 1}
            required
            defaultValue={2}
          />
          <p className="text-xs text-stone-400">Max {RESTAURANT.groupThreshold - 1} pers.</p>
        </div>
      </div>

      {/* Préférence d'espace - la salle exacte est attribuée par l'équipe */}
      <div className="space-y-2">
        <Label htmlFor="t-space">Espace souhaité</Label>
        <Select name="spacePreference" defaultValue="ANY">
          <SelectTrigger id="t-space" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ANY">Indifférent</SelectItem>
            <SelectItem value="INDOOR">Intérieur</SelectItem>
            <SelectItem value="OUTDOOR">Extérieur (terrasse)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-stone-400">
          Nous vous plaçons dans la salle la plus adaptée selon votre souhait et les disponibilités.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        size="lg"
        className="w-full bg-amber-500 text-base font-semibold text-stone-950 hover:bg-amber-400"
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Confirmer ma réservation
      </Button>
    </form>
  );
}

// ─────────────────────────── Formulaire demande groupe ─────────────────

function GroupForm({ onSuccess }: { onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().split("T")[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createReservation(fd);
      if (result.success) {
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Workflow explanation */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
        <ol className="space-y-1.5 text-sm text-amber-900">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              1
            </span>
            Remplissez ce formulaire avec vos informations et besoins.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              2
            </span>
            Un mail vous est envoyé pour confirmer votre demande de réservation de groupe.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              3
            </span>
            Notre équipe vous recontacte pour confirmer et affiner votre demande de réservation de groupe.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
              4
            </span>
            Après confirmation, votre réservation
            est officielle.
          </li>
        </ol>
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-800">
          <Lock className="size-3.5" />
          Aucune salle n&apos;est bloquée avant confirmation mutuelle.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="g-firstName">Prénom *</Label>
          <Input id="g-firstName" name="firstName" required maxLength={80} placeholder="Marie" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="g-name">Nom ou société *</Label>
          <Input id="g-name" name="customerName" required maxLength={80} placeholder="Martin / SARL Exemple" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="g-phone">Téléphone *</Label>
          <Input id="g-phone" name="phone" type="tel" required placeholder="06 00 00 00 00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="g-email">Email *</Label>
          <Input id="g-email" name="email" type="email" required placeholder="contact@societe.fr" />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="g-date">Date souhaitée *</Label>
          <Input id="g-date" name="date" type="date" required min={today} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="g-slot">Service *</Label>
          <Select name="slot" defaultValue="LUNCH" required>
            <SelectTrigger id="g-slot" className="w-full">
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
          <Label htmlFor="g-guests">Nombre de personnes *</Label>
          <Input
            id="g-guests"
            name="guestCount"
            type="number"
            min={RESTAURANT.groupThreshold}
            max={200}
            required
            defaultValue={RESTAURANT.groupThreshold}
          />
          <p className="text-xs text-stone-400">Min {RESTAURANT.groupThreshold} pers.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="g-message">
          Détails de votre événement{" "}
          <span className="text-stone-400">(occasion, besoins spéciaux, menu souhaité…)</span>
        </Label>
        <Textarea
          id="g-message"
          name="message"
          rows={4}
          maxLength={2000}
          placeholder="Séminaire d'entreprise de 20 personnes, repas de fin d'année, anniversaire… Précisez toute demande particulière (allergies, vidéoprojecteur, décoration, etc.)"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        size="lg"
        className="w-full bg-stone-900 text-base font-semibold text-white hover:bg-stone-800"
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Envoyer ma demande de groupe
      </Button>
    </form>
  );
}

// ─────────────────────────── Composant principal ───────────────────────

export function ReservationForm({ initialMode = "table" }: Props) {
  const [mode, setMode] = useState<"table" | "group">(initialMode);
  const [success, setSuccess] = useState<SuccessState>(null);

  if (success) return <SuccessScreen mode={success.mode} />;

  return (
    <div className="space-y-6">
      {/* Sélecteur de mode */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-stone-200 bg-stone-50 p-1.5">
        <button
          type="button"
          onClick={() => setMode("table")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all",
            mode === "table"
              ? "bg-white shadow-sm text-stone-900"
              : "text-stone-500 hover:text-stone-800"
          )}
        >
          <Users className="size-4" />
          Table classique
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              mode === "table"
                ? "bg-amber-100 text-amber-800"
                : "bg-stone-200 text-stone-500"
            )}
          >
            1–{RESTAURANT.groupThreshold - 1} pers.
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMode("group")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all",
            mode === "group"
              ? "bg-white shadow-sm text-stone-900"
              : "text-stone-500 hover:text-stone-800"
          )}
        >
          <Briefcase className="size-4" />
          Groupe / Événement
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              mode === "group"
                ? "bg-stone-900 text-white"
                : "bg-stone-200 text-stone-500"
            )}
          >
            ≥ {RESTAURANT.groupThreshold} pers.
          </span>
        </button>
      </div>

      {/* Description contextuelle */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {mode === "table" ? (
            <TableForm onSuccess={() => setSuccess({ mode: "table" })} />
          ) : (
            <GroupForm onSuccess={() => setSuccess({ mode: "group" })} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

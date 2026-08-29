"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSiteSettings } from "@/app/actions/admin";

type HoursData = {
  hoursLine1: string;
  hoursLine2: string;
  hoursLine3: string;
};

export function HoursForm({ settings }: { settings: HoursData }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateSiteSettings(formData);
      if (result.success) {
        toast.success("Horaires mis à jour et publiés sur le site.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="hoursLine1">
          Ligne 1 - Période principale *
        </Label>
        <Textarea
          id="hoursLine1"
          name="hoursLine1"
          required
          rows={2}
          maxLength={300}
          defaultValue={settings.hoursLine1}
          placeholder="Service du midi de 12h à 14h."
        />
        <p className="text-xs text-stone-400">
          Décrivez vos horaires habituels pour la première période de l&apos;année.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hoursLine2">
          Ligne 2 - Note complémentaire (groupes, exceptions…)
        </Label>
        <Textarea
          id="hoursLine2"
          name="hoursLine2"
          rows={2}
          maxLength={300}
          defaultValue={settings.hoursLine2}
          placeholder="Du Lundi au Vendredi"
        />
        <p className="text-xs text-stone-400">
          Optionnel - pour préciser une règle particulière (groupes, fermetures, etc.).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hoursLine3">
          Ligne 3 - Deuxième période de l&apos;année
        </Label>
        <Textarea
          id="hoursLine3"
          name="hoursLine3"
          rows={2}
          maxLength={300}
          defaultValue={settings.hoursLine3}
          placeholder="Ex : De septembre à décembre : midi 12h–14h · soir 19h–21h."
        />
        <p className="text-xs text-stone-400">
          Optionnel - laissez vide si vous n&apos;avez qu&apos;une seule période.
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Aperçu public</p>
          <p className="mt-1 text-stone-600">
            Ces informations apparaîtront dans la section « Horaires » sur la page d&apos;accueil du site et dans le pied de page.
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="gap-2 bg-stone-900 text-white hover:bg-stone-800"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        Enregistrer les horaires
      </Button>
    </form>
  );
}

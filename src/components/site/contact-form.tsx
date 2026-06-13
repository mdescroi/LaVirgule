"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage } from "@/app/actions/contact";

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await sendContactMessage(formData);
      if (result.success) {
        setSent(true);
        toast.success("Message envoyé ! Nous vous répondrons rapidement.");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center">
        <p className="font-serif text-2xl font-bold text-emerald-800">
          Merci pour votre message !
        </p>
        <p className="mt-3 text-emerald-700">
          Nous vous répondrons dans les plus brefs délais.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nom *</Label>
          <Input id="name" name="name" required maxLength={120} placeholder="Votre nom" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="vous@exemple.fr"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" type="tel" placeholder="06 00 00 00 00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Sujet *</Label>
          <Input
            id="subject"
            name="subject"
            required
            maxLength={150}
            placeholder="Réservation, devis groupe…"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message *</Label>
        <Textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          placeholder="Votre demande…"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        size="lg"
        className="w-full bg-amber-500 font-semibold text-stone-950 hover:bg-amber-400 sm:w-auto"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        Envoyer le message
      </Button>
    </form>
  );
}

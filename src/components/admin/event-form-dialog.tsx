"use client";

import { useTransition, useState, useRef } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { upsertEvent } from "@/app/actions/admin";

type EventRow = {
  id: string;
  title: string;
  description: string;
  date: Date;
  endDate: Date | null;
  location: string | null;
  imageUrl: string | null;
  isPublished: boolean;
};

function toDatetimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventFormDialog({ event }: { event?: EventRow }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string>(event?.imageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!event;

  function handleOpenChange(o: boolean) {
    setOpen(o);
    if (!o) setImageUrl(event?.imageUrl ?? "");
  }

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Seules les images sont acceptées.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop grande (max 5 Mo).");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/event", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'upload");
      setImageUrl(data.path as string);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("imageUrl", imageUrl);
    if (isEdit) formData.set("id", event.id);
    startTransition(async () => {
      const result = await upsertEvent(formData);
      if (result.success) {
        toast.success(isEdit ? "Événement mis à jour." : "Événement créé.");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button className="bg-stone-900 text-white hover:bg-stone-700 gap-1.5">
            <Plus className="size-4" />
            Nouvel événement
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {isEdit ? "Modifier l'événement" : "Créer un événement"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* Titre */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              name="title"
              required
              maxLength={150}
              defaultValue={event?.title}
              placeholder="Soirée à thème, Dîner concert…"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              required
              rows={4}
              maxLength={2000}
              defaultValue={event?.description}
              placeholder="Détails de l'événement…"
            />
          </div>

          {/* Date / Heure de début */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Date et heure de début *</Label>
            <Input
              id="date"
              name="date"
              type="datetime-local"
              required
              defaultValue={event ? toDatetimeLocal(new Date(event.date)) : ""}
            />
          </div>

          {/* Date / Heure de fin */}
          <div className="space-y-1.5">
            <Label htmlFor="endDate">Date et heure de fin (optionnel)</Label>
            <Input
              id="endDate"
              name="endDate"
              type="datetime-local"
              defaultValue={event?.endDate ? toDatetimeLocal(new Date(event.endDate)) : ""}
            />
          </div>

          {/* Lieu */}
          <div className="space-y-1.5">
            <Label htmlFor="location">Lieu (optionnel)</Label>
            <Input
              id="location"
              name="location"
              maxLength={200}
              defaultValue={event?.location ?? ""}
              placeholder="Salle Lounge, Terrasse…"
            />
          </div>

          {/* Image drag & drop */}
          <div className="space-y-1.5">
            <Label>Image (optionnel)</Label>
            {imageUrl ? (
              <div className="relative overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Aperçu"
                  className="h-40 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
                  aria-label="Supprimer l'image"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
                  dragOver
                    ? "border-amber-400 bg-amber-50 text-amber-600"
                    : "border-stone-300 bg-stone-50 text-stone-400 hover:border-stone-400 hover:text-stone-500"
                }`}
              >
                {uploading ? (
                  <Loader2 className="size-7 animate-spin" />
                ) : (
                  <ImagePlus className="size-7" />
                )}
                <span className="text-sm font-medium">
                  {uploading ? "Envoi en cours…" : "Glissez une image ici ou cliquez"}
                </span>
                <span className="text-xs">JPG, PNG, WEBP - max 5 Mo</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Publié */}
          <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
            <input
              id="isPublished"
              name="isPublished"
              type="checkbox"
              className="size-4 accent-amber-500"
              defaultChecked={event ? event.isPublished : true}
            />
            <Label htmlFor="isPublished" className="cursor-pointer font-normal">
              Publier cet événement sur le site
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-stone-900 text-white hover:bg-stone-700"
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Expand, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function EventImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group relative block w-full cursor-zoom-in overflow-hidden"
          aria-label={`Agrandir l'image : ${alt}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="block h-auto w-full object-contain" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
            <Expand className="size-3.5" />
            Voir en entier
          </div>
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] border-none bg-transparent p-0 shadow-none sm:max-w-3xl"
      >
        <DialogTitle className="sr-only">{alt}</DialogTitle>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="max-h-[85vh] w-full rounded-xl object-contain" />
        <DialogClose className="absolute -top-3 -right-3 flex size-9 items-center justify-center rounded-full bg-white text-stone-900 shadow-lg transition-colors hover:bg-stone-100">
          <X className="size-5" />
          <span className="sr-only">Fermer</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

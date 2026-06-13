"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus } from "lucide-react";
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
import { upsertDish } from "@/app/actions/admin";

export type DishData = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "STARTER" | "MAIN" | "DESSERT";
  isAvailable: boolean;
};

export function DishFormDialog({ dish }: { dish?: DishData }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await upsertDish(formData);
      if (result.success) {
        toast.success(dish ? "Plat modifié." : "Plat ajouté à la carte.");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {dish ? (
          <Button variant="ghost" size="sm" aria-label={`Modifier ${dish.name}`}>
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button className="bg-stone-900 text-white hover:bg-stone-800">
            <Plus className="size-4" /> Ajouter un plat
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {dish ? `Modifier « ${dish.name} »` : "Nouveau plat"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {dish && <input type="hidden" name="id" value={dish.id} />}

          <div className="space-y-2">
            <Label htmlFor="dish-name">Nom *</Label>
            <Input
              id="dish-name"
              name="name"
              required
              maxLength={120}
              defaultValue={dish?.name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dish-description">Description</Label>
            <Textarea
              id="dish-description"
              name="description"
              rows={3}
              maxLength={500}
              defaultValue={dish?.description}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dish-price">Prix (€) *</Label>
              <Input
                id="dish-price"
                name="price"
                type="number"
                step="0.10"
                min="0"
                required
                defaultValue={dish?.price}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dish-category">Catégorie *</Label>
              <Select name="category" defaultValue={dish?.category ?? "MAIN"}>
                <SelectTrigger id="dish-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STARTER">Entrée</SelectItem>
                  <SelectItem value="MAIN">Plat</SelectItem>
                  <SelectItem value="DESSERT">Dessert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              name="isAvailable"
              defaultChecked={dish?.isAvailable ?? true}
              className="size-4 accent-stone-900"
            />
            Disponible à la carte
          </label>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {dish ? "Enregistrer les modifications" : "Ajouter le plat"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

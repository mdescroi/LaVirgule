"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertMenuOfTheDay } from "@/app/actions/admin";

type MenuData = {
  date: string;
  starterName: string;
  mainCourseName: string;
  dessertName: string;
  priceStarterMain: number;
  priceFullMenu: number;
  priceMainDessert: number;
} | null;

export function MenuOfTheDayForm({ menu }: { menu: MenuData }) {
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().split("T")[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await upsertMenuOfTheDay(formData);
      if (result.success) {
        toast.success("Menu du jour enregistré.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="menu-date">Date *</Label>
        <Input
          id="menu-date"
          name="date"
          type="date"
          required
          defaultValue={menu?.date ?? today}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="menu-price-sm">Entrée + Plat (€) *</Label>
          <Input
            id="menu-price-sm"
            name="priceStarterMain"
            type="number"
            step="0.10"
            min="0"
            required
            defaultValue={menu?.priceStarterMain ?? 14.9}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="menu-price-full">Menu complet (€) *</Label>
          <Input
            id="menu-price-full"
            name="priceFullMenu"
            type="number"
            step="0.10"
            min="0"
            required
            defaultValue={menu?.priceFullMenu ?? 16.9}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="menu-price-md">Plat + Dessert (€) *</Label>
          <Input
            id="menu-price-md"
            name="priceMainDessert"
            type="number"
            step="0.10"
            min="0"
            required
            defaultValue={menu?.priceMainDessert ?? 14.9}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="menu-starter">Entrée *</Label>
        <Input
          id="menu-starter"
          name="starterName"
          required
          maxLength={150}
          defaultValue={menu?.starterName}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="menu-main">Plat *</Label>
        <Input
          id="menu-main"
          name="mainCourseName"
          required
          maxLength={150}
          defaultValue={menu?.mainCourseName}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="menu-dessert">Dessert *</Label>
        <Input
          id="menu-dessert"
          name="dessertName"
          required
          maxLength={150}
          defaultValue={menu?.dessertName}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Enregistrer le menu du jour
      </Button>
    </form>
  );
}

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DishFormDialog } from "@/components/admin/dish-form-dialog";
import { MenuOfTheDayForm } from "@/components/admin/menu-of-the-day-form";
import { deleteDish, toggleDishAvailability, createDishSubCategory, deleteDishSubCategory } from "@/app/actions/admin";
import { Trash2, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  STARTER: "Entrée",
  MAIN: "Plat",
  DESSERT: "Dessert",
};

const PARENT_LABELS: Record<string, string> = {
  STARTER: "Entrées",
  MAIN: "Plats",
  DESSERT: "Desserts",
};

export default async function AdminMenuPage() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [dishes, menuOfTheDay, subCategories] = await Promise.all([
    prisma.dish.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: { subCategory: true },
    }),
    prisma.menuOfTheDay.findFirst({
      where: { date: { gte: today } },
      orderBy: { date: "asc" },
    }),
    prisma.dishSubCategory.findMany({
      orderBy: [{ parentCategory: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  const subCatProps = subCategories.map((sc) => ({
    id: sc.id,
    name: sc.name,
    parentCategory: sc.parentCategory,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Carte & Menu du jour
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Modifiez le menu du jour, gérez les plats et les catégories de la carte.
        </p>
      </div>

      {/* Menu du jour */}
      <Card>
        <CardHeader>
          <CardTitle>Menu du jour</CardTitle>
        </CardHeader>
        <CardContent>
          <MenuOfTheDayForm
            menu={
              menuOfTheDay
                ? {
                    date: menuOfTheDay.date.toISOString().split("T")[0],
                    starterName: menuOfTheDay.starterName,
                    mainCourseName: menuOfTheDay.mainCourseName,
                    dessertName: menuOfTheDay.dessertName,
                    priceStarterMain: Number(menuOfTheDay.priceStarterMain),
                    priceFullMenu: Number(menuOfTheDay.priceFullMenu),
                    priceMainDessert: Number(menuOfTheDay.priceMainDessert),
                  }
                : null
            }
          />
        </CardContent>
      </Card>

      {/* Sous-catégories */}
      <Card>
        <CardHeader>
          <CardTitle>Catégories de plats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["STARTER", "MAIN", "DESSERT"] as const).map((cat) => {
            const items = subCategories.filter((sc) => sc.parentCategory === cat);
            return (
              <div key={cat}>
                <p className="mb-2 text-sm font-semibold text-stone-600">{PARENT_LABELS[cat]}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {items.map((sc) => (
                    <form key={sc.id} action={deleteDishSubCategory} className="flex items-center">
                      <input type="hidden" name="id" value={sc.id} />
                      <Badge className="flex items-center gap-1 bg-stone-100 text-stone-700 hover:bg-stone-100 pr-1">
                        {sc.name}
                        <button
                          type="submit"
                          className="ml-1 rounded-full p-0.5 text-stone-400 hover:bg-red-100 hover:text-red-600"
                          title={`Supprimer ${sc.name}`}
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </Badge>
                    </form>
                  ))}
                  <form action={createDishSubCategory} className="flex items-center gap-1">
                    <input type="hidden" name="parentCategory" value={cat} />
                    <input
                      name="name"
                      required
                      maxLength={80}
                      placeholder="+ Nouvelle catégorie"
                      className="h-7 rounded-md border border-dashed border-stone-300 px-2 text-xs text-stone-600 outline-none focus:border-amber-400 w-40"
                    />
                    <Button type="submit" size="sm" variant="ghost" className="h-7 px-2">
                      <Plus className="size-3.5" />
                    </Button>
                  </form>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* La carte */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>La Carte ({dishes.length} plats)</CardTitle>
          <DishFormDialog subCategories={subCatProps} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plat</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead>Disponibilité</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dishes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-stone-500">
                    Aucun plat. Ajoutez votre premier plat !
                  </TableCell>
                </TableRow>
              )}
              {dishes.map((dish) => (
                <TableRow key={dish.id}>
                  <TableCell>
                    <p className="font-medium text-stone-900">{dish.name}</p>
                    {dish.description && (
                      <p className="max-w-72 truncate text-xs text-stone-500">
                        {dish.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span>{CATEGORY_LABELS[dish.category]}</span>
                    {dish.subCategory && (
                      <span className="ml-1 text-xs text-stone-400">/ {dish.subCategory.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {Number(dish.price).toFixed(2).replace(".", ",")} €
                  </TableCell>
                  <TableCell>
                    <form action={toggleDishAvailability}>
                      <input type="hidden" name="id" value={dish.id} />
                      <button type="submit" title="Cliquer pour basculer">
                        <Badge
                          className={
                            dish.isAvailable
                              ? "cursor-pointer bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "cursor-pointer bg-stone-200 text-stone-600 hover:bg-stone-300"
                          }
                        >
                          {dish.isAvailable ? "Disponible" : "Masqué"}
                        </Badge>
                      </button>
                    </form>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <DishFormDialog
                        subCategories={subCatProps}
                        dish={{
                          id: dish.id,
                          name: dish.name,
                          description: dish.description,
                          price: Number(dish.price),
                          category: dish.category,
                          subCategoryId: dish.subCategoryId,
                          isAvailable: dish.isAvailable,
                        }}
                      />
                      <form action={deleteDish}>
                        <input type="hidden" name="id" value={dish.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          aria-label={`Supprimer ${dish.name}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

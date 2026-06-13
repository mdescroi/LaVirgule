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
import { deleteDish, toggleDishAvailability } from "@/app/actions/admin";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  STARTER: "Entrée",
  MAIN: "Plat",
  DESSERT: "Dessert",
};

export default async function AdminMenuPage() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [dishes, menuOfTheDay] = await Promise.all([
    prisma.dish.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.menuOfTheDay.findFirst({
      where: { date: { gte: today } },
      orderBy: { date: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Carte & Menu du jour
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Modifiez le menu du jour et gérez les plats de la carte.
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
                    price: Number(menuOfTheDay.price),
                  }
                : null
            }
          />
        </CardContent>
      </Card>

      {/* La carte */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>La Carte ({dishes.length} plats)</CardTitle>
          <DishFormDialog />
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
                  <TableCell>{CATEGORY_LABELS[dish.category]}</TableCell>
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
                        dish={{
                          id: dish.id,
                          name: dish.name,
                          description: dish.description,
                          price: Number(dish.price),
                          category: dish.category,
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

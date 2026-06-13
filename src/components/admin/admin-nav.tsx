"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, LogOut, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/reservations", label: "Réservations", icon: CalendarDays },
  { href: "/admin/menu", label: "Carte & Menu", icon: UtensilsCrossed },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-stone-200 bg-white md:min-h-svh md:w-60 md:border-b-0 md:border-r">
      <div className="border-b border-stone-200 p-5">
        <Link href="/admin" className="font-serif text-xl font-bold text-stone-900">
          La Virgule<span className="text-amber-500">,</span>
        </Link>
        <p className="text-xs text-stone-500">Administration</p>
      </div>

      <nav className="flex flex-1 flex-row gap-1 p-3 md:flex-col">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-stone-900 text-white"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              )}
            >
              <item.icon className="size-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between gap-2 border-t border-stone-200 p-3">
        <Link
          href="/"
          className="text-xs text-stone-500 hover:text-stone-900 hover:underline"
        >
          ← Voir le site
        </Link>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm" className="text-stone-600">
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </form>
      </div>
    </aside>
  );
}

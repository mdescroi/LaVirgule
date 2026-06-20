"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RESTAURANT } from "@/lib/config";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/carte", label: "La Carte" },
  { href: "/evenements", label: "Événements" },
  { href: "/#espaces", label: "Nos Espaces" },
  { href: "/#horaires", label: "Horaires" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Masque le header public dans l'admin
  if (pathname.startsWith("/admin")) return null;

  const solid = scrolled || !isHome || mobileOpen;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        solid
          ? "bg-stone-950/95 backdrop-blur-md shadow-lg"
          : "bg-gradient-to-b from-black/60 to-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-baseline gap-1 text-white">
          <span className="font-serif text-2xl font-bold tracking-tight">
            La Virgule
          </span>
          <span className="text-amber-400 text-3xl leading-none font-serif">,</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-stone-200 transition-colors hover:text-amber-400"
            >
              {link.label}
            </Link>
          ))}
          <Button
            asChild
            className="bg-amber-500 text-stone-950 hover:bg-amber-400 font-semibold gap-2"
          >
            <a href={RESTAURANT.phoneHref}>
              <Phone className="size-4" />
              {RESTAURANT.phone}
            </a>
          </Button>
        </nav>

        <button
          type="button"
          className="text-white md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Ouvrir le menu"
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="border-t border-stone-800 bg-stone-950 px-4 py-4 md:hidden">
          <ul className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block py-1 text-stone-200 hover:text-amber-400"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Button
                asChild
                className="w-full bg-amber-500 text-stone-950 hover:bg-amber-400 font-semibold gap-2"
              >
                <a href={RESTAURANT.phoneHref} onClick={() => setMobileOpen(false)}>
                  <Phone className="size-4" />
                  Réserver par téléphone
                </a>
              </Button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

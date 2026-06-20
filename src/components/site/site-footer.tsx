"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { RESTAURANT } from "@/lib/config";

interface SiteFooterProps {
  hoursLine1?: string;
  hoursLine2?: string;
  hoursLine3?: string;
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M13.5 21v-7h2.5l.5-3h-3V9.1c0-.9.3-1.6 1.7-1.6H16.6V4.8c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4V11H7.5v3h2.7v7h3.3Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SiteFooter({ hoursLine1, hoursLine2, hoursLine3 }: SiteFooterProps = {}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  const line1 = hoursLine1 ?? RESTAURANT.hours.janToAug;
  const line2 = hoursLine2 ?? RESTAURANT.hours.janToAugGroups;
  const line3 = hoursLine3 ?? RESTAURANT.hours.sepToDec;

  return (
    <footer className="bg-stone-950 text-stone-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Marque */}
        <div>
          <p className="font-serif text-2xl font-bold text-white">
            La Virgule<span className="text-amber-400">,</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">
            Restaurant traditionnel à Chaban / Chauray, aux portes de Niort.
            Cuisine généreuse, accueil de groupes, séminaires et repas
            d&apos;entreprise.
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href="https://www.facebook.com/restaurantlavirgule/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="rounded-full border border-stone-700 p-2 transition-colors hover:border-amber-400 hover:text-amber-400"
            >
              <FacebookIcon className="size-4" />
            </a>
            <a
              href="https://www.instagram.com/restaurantlavirgulechauray/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="rounded-full border border-stone-700 p-2 transition-colors hover:border-amber-400 hover:text-amber-400"
            >
              <InstagramIcon className="size-4" />
            </a>
          </div>
        </div>

        {/* Horaires */}
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <Clock className="size-4 text-amber-400" /> Horaires
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-stone-400">
            {line1 && <li>{line1}</li>}
            {line2 && <li>{line2}</li>}
            {line3 && <li>{line3}</li>}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-semibold text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link href="/evenements" className="transition-colors hover:text-amber-400">
                Événements
              </Link>
            </li>
            <li>
              <a
                href={RESTAURANT.phoneHref}
                className="flex items-center gap-2 transition-colors hover:text-amber-400"
              >
                <Phone className="size-4 text-amber-400" /> {RESTAURANT.phone}
              </a>
            </li>
            <li>
              <a
                href={RESTAURANT.emailHref}
                className="flex items-center gap-2 transition-colors hover:text-amber-400"
              >
                <Mail className="size-4 text-amber-400" /> {RESTAURANT.email}
              </a>
            </li>
          </ul>
        </div>

        {/* Accès */}
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-white">
            <MapPin className="size-4 text-amber-400" /> Nous trouver
          </h3>
          <address className="mt-4 text-sm not-italic leading-relaxed text-stone-400">
            {RESTAURANT.address}
            <br />
            {RESTAURANT.city} ({RESTAURANT.zip})
            <br />
            Zone de Niort
          </address>
          <a
            href={RESTAURANT.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-amber-400 hover:underline"
          >
            Voir le plan d&apos;accès →
          </a>
        </div>
      </div>

      <div className="border-t border-stone-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-stone-500 sm:flex-row sm:px-6 lg:px-8">
          <p suppressHydrationWarning>
            © {new Date().getFullYear()} {RESTAURANT.name} — Tous droits réservés.
          </p>
          <Link href="/admin" className="transition-colors hover:text-stone-300">
            Espace administration
          </Link>
        </div>
      </div>
    </footer>
  );
}

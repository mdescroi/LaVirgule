import { Clock, MapPin, Phone, Mail } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { RESTAURANT } from "@/lib/config";

type Props = {
  hoursLine1: string;
  hoursLine2: string;
  hoursLine3: string;
};

export function HoursSection({ hoursLine1, hoursLine2, hoursLine3 }: Props) {
  const lines = [hoursLine1, hoursLine2, hoursLine3].filter(Boolean);

  return (
    <section id="horaires" className="scroll-mt-24 bg-stone-950 py-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-amber-400">
            Quand nous rendre visite
          </p>
          <h2 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">
            Horaires &amp; Accès
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Horaires */}
          <Reveal delay={0.1} className="lg:col-span-2">
            <div className="rounded-2xl border border-stone-800 bg-stone-900 p-8">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/20">
                  <Clock className="size-5 text-amber-400" />
                </div>
                <h3 className="font-serif text-xl font-semibold">
                  Heures d&apos;ouverture
                </h3>
              </div>
              <ul className="mt-6 space-y-4">
                {lines.map((line, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-1 block size-1.5 shrink-0 rounded-full bg-amber-400" />
                    <span className="text-stone-300 leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-xl border border-stone-700 bg-stone-800/50 p-4">
                <p className="text-sm text-stone-400">
                  Pour toute question sur nos horaires ou pour une réservation,{" "}
                  <a
                    href={RESTAURANT.phoneHref}
                    className="font-semibold text-amber-400 hover:underline"
                  >
                    appelez-nous directement
                  </a>
                  .
                </p>
              </div>
            </div>
          </Reveal>

          {/* Contact & Accès */}
          <Reveal delay={0.2}>
            <div className="flex h-full flex-col gap-6">
              {/* Téléphone */}
              <div className="rounded-2xl border border-stone-800 bg-stone-900 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-amber-500/20">
                    <Phone className="size-4 text-amber-400" />
                  </div>
                  <h3 className="font-semibold">Téléphone</h3>
                </div>
                <a
                  href={RESTAURANT.phoneHref}
                  className="mt-3 block text-lg font-bold text-amber-400 hover:underline"
                >
                  {RESTAURANT.phone}
                </a>
              </div>

              {/* Email */}
              <div className="rounded-2xl border border-stone-800 bg-stone-900 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-amber-500/20">
                    <Mail className="size-4 text-amber-400" />
                  </div>
                  <h3 className="font-semibold">Email</h3>
                </div>
                <a
                  href={RESTAURANT.emailHref}
                  className="mt-3 block break-all text-sm text-amber-400 hover:underline"
                >
                  {RESTAURANT.email}
                </a>
              </div>

              {/* Adresse */}
              <div className="flex-1 rounded-2xl border border-stone-800 bg-stone-900 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-amber-500/20">
                    <MapPin className="size-4 text-amber-400" />
                  </div>
                  <h3 className="font-semibold">Adresse</h3>
                </div>
                <address className="mt-3 text-sm not-italic leading-relaxed text-stone-300">
                  {RESTAURANT.address}
                  <br />
                  {RESTAURANT.city} ({RESTAURANT.zip})
                </address>
                <a
                  href={RESTAURANT.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-amber-400 hover:underline"
                >
                  Voir sur Google Maps →
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

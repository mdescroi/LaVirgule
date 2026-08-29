export const RESTAURANT = {
  name: "La Virgule",
  tagline: "Restaurant traditionnel à Niort — Chauray",
  address: "83, rue André Bellot",
  city: "Chaban / Chauray",
  zip: "79180",
  fullAddress: "83, rue André Bellot, 79180 Chauray (Chaban) — Niort",
  phone: "05 49 33 13 70",
  phoneHref: "tel:+33549331370",
  email: "contact@restaurantlavirgule.fr",
  emailHref: "mailto:contact@restaurantlavirgule.fr",
  mapsUrl:
    "https://www.google.com/maps/place//data=!4m2!3m1!1s0x480730b825acd8bd:0x23cc974a3c7a29cb?sa=X&ved=1t:8290&ictx=111",
  hours: {
    janToAug: "Service du midi de 12h à 14h.",
    janToAugGroups:
      "Possibilité d'accueillir des groupes le soir à partir de 15 personnes durant cette même période.",
    sepToDec:
      "De septembre à décembre : ouvert le midi et le soir, de 12h à 14h (service du midi) et de 19h à 21h30 (service du soir).",
  },
  groupThreshold: 12,
} as const;

export const SERVICE_SLOTS = [
  { value: "LUNCH", label: "Midi (12h – 14h)" },
  { value: "DINNER", label: "Soir (19h – 21h30)" },
  { value: "OTHER", label: "Autre (Journée entière, événement...)" },
] as const;

/** Couverts max réservables EN LIGNE par service (tables classiques seulement). */
export const ONLINE_SERVICE_CAP = 20;

/** Horizon de réservation EN LIGNE pour les tables classiques (en jours, calendaires). Les demandes de groupe ne sont pas concernées. */
export const RESERVATION_WINDOW_DAYS = 21;

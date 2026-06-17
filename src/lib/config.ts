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
    "https://www.google.com/maps/search/?api=1&query=83+rue+Andr%C3%A9+Bellot+79180+Chauray",
  hours: {
    janToAug: "De janvier à août : ouvert uniquement le midi, de 12h à 14h.",
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

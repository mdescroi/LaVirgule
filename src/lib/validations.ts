import { z } from "zod";

export const reservationSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(80),
  customerName: z.string().min(1, "Nom requis").max(80),
  email: z.string().email("Email invalide"),
  phone: z
    .string()
    .min(6, "Téléphone requis")
    .max(20)
    .regex(/^[+0-9 .()-]+$/, "Téléphone invalide"),
  date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Date invalide"),
  slot: z.enum(["LUNCH", "DINNER", "OTHER"]),
  guestCount: z.coerce.number().int().min(1, "Minimum 1 personne").max(200),
  spacePreference: z.enum(["INDOOR", "OUTDOOR", "ANY"]).optional(),
  spaceId: z.string().optional(),
  message: z.string().max(2000).optional(),
});

export type ReservationInput = z.infer<typeof reservationSchema>;

export const contactSchema = z.object({
  name: z.string().min(1, "Nom requis").max(120),
  email: z.string().email("Email invalide"),
  phone: z.string().max(20).optional(),
  subject: z.string().min(1, "Sujet requis").max(150),
  message: z.string().min(10, "Message trop court (10 caractères min.)").max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const dishSchema = z.object({
  name: z.string().min(1, "Nom requis").max(120),
  description: z.string().max(500),
  price: z.coerce.number().min(0, "Prix invalide").max(999),
  category: z.enum(["STARTER", "MAIN", "DESSERT"]),
  isAvailable: z.coerce.boolean(),
});

export const menuOfTheDaySchema = z.object({
  date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Date invalide"),
  starterName: z.string().min(1, "Entrée requise").max(150),
  mainCourseName: z.string().min(1, "Plat requis").max(150),
  dessertName: z.string().min(1, "Dessert requis").max(150),
  priceStarterMain: z.coerce.number().min(0).max(999),
  priceFullMenu: z.coerce.number().min(0).max(999),
  priceMainDessert: z.coerce.number().min(0).max(999),
});

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const siteSettingsSchema = z.object({
  hoursLine1: z.string().min(1, "Ligne 1 requise").max(300),
  hoursLine2: z.string().max(300),
  hoursLine3: z.string().max(300),
});

export const dishSubCategorySchema = z.object({
  name: z.string().min(1, "Nom requis").max(80),
  parentCategory: z.enum(["STARTER", "MAIN", "DESSERT"]),
});

export const eventSchema = z.object({
  title: z.string().min(1, "Titre requis").max(150),
  description: z.string().min(1, "Description requise").max(2000),
  date: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Date invalide"),
  endDate: z.string().optional().refine((v) => !v || !Number.isNaN(Date.parse(v)), "Date de fin invalide"),
  location: z.string().max(200).optional(),
  imageUrl: z.string().max(500).optional().or(z.literal("")),
  isPublished: z.coerce.boolean(),
});

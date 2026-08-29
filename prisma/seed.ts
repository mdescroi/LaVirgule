import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ── Admin ──────────────────────────────────────────────
  const email = process.env.ADMIN_EMAIL ?? "admin@restaurantlavirgule.fr";
  const password = process.env.ADMIN_PASSWORD ?? "ChangezMoi79!";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name: "Administrateur" },
  });
  console.log(`✔ Admin créé : ${email}`);

  // ── Espaces ────────────────────────────────────────────
  // L'ordre de création détermine l'ordre d'affichage (tri par createdAt)
  const spaces = [
    {
      name: "Salle Lounge",
      capacity: 50,
      isOutdoor: false,
      sortOrder: 1,
      description: "Notre salle principale avec son espace bar : l'endroit idéal pour un moment convivial entre amis ou en famille, dans une atmosphère chaleureuse et décontractée.",
      imageUrl: "/img/salleprincipale.jpg",
    },
    {
      name: "Salle Idylle",
      capacity: 40,
      isOutdoor: false,
      sortOrder: 2,
      description: "Un cadre raffiné et élégant, pensé pour les repas intimes. Lumières tamisées et décoration soignée font de cette salle le choix parfait pour vos dîners en amoureux ou vos célébrations.",
      imageUrl: "/img/salle2-1024x682.jpg",
    },
    {
      name: "Salle Cosy",
      capacity: 30,
      isOutdoor: false,
      sortOrder: 3,
      description: "Une atmosphère dynamique et contemporaine, idéale pour vos déjeuners d'affaires, réunions d'équipe ou tout événement qui mérite un cadre au goût du jour.",
      imageUrl: "/img/salle3-1024x682.jpg",
    },
    {
      name: "Salle Séminaire",
      capacity: 50,
      isOutdoor: false,
      sortOrder: 4,
      description: "Dédiée aux séminaires et réceptions privées, notre grande salle peut accueillir jusqu'à 50 personnes. Privatisation disponible pour vos événements professionnels et personnels.",
      imageUrl: "/img/salle-reception-3-1-1024x682.jpg",
    },
    {
      name: "Terrasse",
      capacity: 35,
      isOutdoor: true,
      sortOrder: 5,
      description: "Notre terrasse extérieure ombragée, ouverte aux beaux jours. Profitez d'un repas en plein air dans un cadre verdoyant et apaisant.",
      imageUrl: "/img/terrasse-1024x682.jpg",
    },
  ];

  // On vide les anciens espaces pour éviter les conflits de noms/IDs lors du reclassement
  await prisma.space.deleteMany({});
  
  for (const s of spaces) {
    await prisma.space.create({ data: s });
  }
  console.log(`✔ ${spaces.length} espaces créés`);

  // ── Sous-catégories + Carte (toujours recréées) ───────
  await prisma.dish.deleteMany({});
  await prisma.dishSubCategory.deleteMany({});

  const subCatDefs = [
    // STARTER
    { name: "Nos Entrées",    parentCategory: "STARTER" as const, sortOrder: 1 },
    { name: "Notre Planche",  parentCategory: "STARTER" as const, sortOrder: 2 },
    // MAIN
    { name: "Nos Salades",         parentCategory: "MAIN" as const, sortOrder: 1 },
    { name: "Nos Viandes",         parentCategory: "MAIN" as const, sortOrder: 2 },
    { name: "Les Burgers",         parentCategory: "MAIN" as const, sortOrder: 3 },
    { name: "Nos Poissons",        parentCategory: "MAIN" as const, sortOrder: 4 },
    { name: "Végétarien",          parentCategory: "MAIN" as const, sortOrder: 5 },
    { name: "Assiette de Fromage", parentCategory: "MAIN" as const, sortOrder: 6 },
  ];
  await prisma.dishSubCategory.createMany({ data: subCatDefs });
  const createdSubCats = await prisma.dishSubCategory.findMany({
    orderBy: [{ parentCategory: "asc" }, { sortOrder: "asc" }],
  });
  const sc = Object.fromEntries(createdSubCats.map((s) => [s.name, s.id]));
  console.log(`✔ ${createdSubCats.length} sous-catégories créées`);

  const dishes = [
    // ── NOS ENTRÉES ────────────────────────────────────
    { name: "Tartare de thon exotique",        description: "Marinade au ponzu.",                                                                  price: 14.5, category: "STARTER" as const, subCategoryId: sc["Nos Entrées"],    sortOrder: 1 },
    { name: "Cromesquis de chèvre au panko",   description: "Crème d'ail et basilic.",                                                             price: 13.5, category: "STARTER" as const, subCategoryId: sc["Nos Entrées"],    sortOrder: 2 },
    { name: "Tempura rolls au salicorne",       description: "Sa sauce miso.",                                                                      price: 14.5, category: "STARTER" as const, subCategoryId: sc["Nos Entrées"],    sortOrder: 3 },
    { name: "Gaspacho Verde et ricotta",        description: "Au piment d'espelette.",                                                              price: 12.5, category: "STARTER" as const, subCategoryId: sc["Nos Entrées"],    sortOrder: 4 },

    // ── NOTRE PLANCHE ──────────────────────────────────
    { name: "Planche mixte pour 2 personnes",  description: "Jambon serrano, spianatta, coppa, crottin de chèvre fermier local, saint-nectaire.",  price: 19.0, category: "STARTER" as const, subCategoryId: sc["Notre Planche"],  sortOrder: 1 },

    // ── NOS SALADES ────────────────────────────────────
    { name: "Salade César",       description: "Salade verte, poulet croustillant, tomate, grana padano, croutons.",                                        price: 18.5, category: "MAIN" as const, subCategoryId: sc["Nos Salades"], sortOrder: 1 },
    { name: "Salade Italienne",   description: "Salade verte, burrata, tomate, parmesan, pesto vert.",                                                      price: 18.5, category: "MAIN" as const, subCategoryId: sc["Nos Salades"], sortOrder: 2 },
    { name: "Salade Charentaise", description: "Salade verte, melon charentais, tomate, pignon pin torréfié, jambon serrano affiné 9 mois.",                price: 18.5, category: "MAIN" as const, subCategoryId: sc["Nos Salades"], sortOrder: 3 },

    // ── NOS VIANDES ────────────────────────────────────
    { name: "Brochette de magret de canard",   description: "Jus corsé à l'orange infusé au baie de sechuan et ratatouille.",                      price: 24.0, category: "MAIN" as const, subCategoryId: sc["Nos Viandes"], sortOrder: 1 },
    { name: "Entrecôte VBF ≈300g",             description: "Frites maison, salade, sauce au poivre.",                                             price: 28.0, category: "MAIN" as const, subCategoryId: sc["Nos Viandes"], sortOrder: 2 },
    { name: "Tartare de bœuf aux 4 saveurs",   description: "Cornichons, câpres, persil, échalotes et frites maison.",                             price: 24.0, category: "MAIN" as const, subCategoryId: sc["Nos Viandes"], sortOrder: 3 },
    { name: "Ribs de porc « Malté »",          description: "Ribs à la bière brune, pommes de terre grenailles et salade verte.",                  price: 22.0, category: "MAIN" as const, subCategoryId: sc["Nos Viandes"], sortOrder: 4 },

    // ── LES BURGERS ────────────────────────────────────
    { name: "Burger signature La Virgule", description: "Bun, steak haché angus, oignon frit, cheddar, sauce fourme d'ambert.",                    price: 19.0, category: "MAIN" as const, subCategoryId: sc["Les Burgers"], sortOrder: 1 },
    { name: "Burger Végétarien",           description: "Bun, steak végétal, oignon frit, sauce moutarde et miel.",                                price: 19.0, category: "MAIN" as const, subCategoryId: sc["Les Burgers"], sortOrder: 2 },

    // ── NOS POISSONS ───────────────────────────────────
    { name: "Pavé de maigre rôti",              description: "Crème citronnée kalamansi et poêlée de légumes.",                  price: 25.0, category: "MAIN" as const, subCategoryId: sc["Nos Poissons"], sortOrder: 1 },
    { name: "Crevettes sauvages à la plancha",  description: "Crème d'ail et risotto crémeux.",                                  price: 23.0, category: "MAIN" as const, subCategoryId: sc["Nos Poissons"], sortOrder: 2 },
    { name: "Filet de saint pierre",            description: "Beurre rouge et riz sauvage.",                                     price: 26.5, category: "MAIN" as const, subCategoryId: sc["Nos Poissons"], sortOrder: 3 },
    { name: "Filet de bar à la plancha",        description: "Sauce aux agrumes et poêlée de légumes.",                          price: 25.0, category: "MAIN" as const, subCategoryId: sc["Nos Poissons"], sortOrder: 4 },

    // ── VÉGÉTARIEN ─────────────────────────────────────
    { name: "Bo Bun froide et ses légumes", description: "Vermicelles de riz, légumes croquants, éclat de cacahuète grillé.",                       price: 18.0, category: "MAIN" as const, subCategoryId: sc["Végétarien"],          sortOrder: 1 },

    // ── ASSIETTE DE FROMAGE ────────────────────────────
    { name: "Assiette de fromages",        description: "Accompagnée de salade. Crottin de chèvre, comté, saint-nectaire.",                        price:  9.0, category: "MAIN" as const, subCategoryId: sc["Assiette de Fromage"], sortOrder: 1 },

    // ── NOS DESSERTS ───────────────────────────────────
    { name: "Tarte fraises déstructurée",    description: "Base de crumble, fraises fraîches locales, glace crème Isigny, gel et tuile au basilic.",                                   price: 9.0, category: "DESSERT" as const, sortOrder: 1 },
    { name: "Nuage verveine pêche abricot",  description: "Mousse verveine, marmelade pêche blanche, insert confit abricot, sorbet abricot et tuile amande.",                          price: 9.5, category: "DESSERT" as const, sortOrder: 2 },
    { name: "Pavlova mangue coco",           description: "Meringue française, tartare de mangue, glace coco, ganache montée coco, coulis de mangue.",                                 price: 8.5, category: "DESSERT" as const, sortOrder: 3 },
    { name: "Finger chocolat cerise",        description: "Mousse chocolat noir, insert confit cerise, feuilletine praliné.",                                                           price: 9.0, category: "DESSERT" as const, sortOrder: 4 },
    { name: "Café gourmand",                 description: "Sélection du pâtissier.",                                                                                                   price: 9.5, category: "DESSERT" as const, sortOrder: 5 },
    { name: "Salade de fruits frais",        description: "",                                                                                                                           price: 7.5, category: "DESSERT" as const, sortOrder: 6 },
  ];

  await prisma.dish.createMany({ data: dishes });
  console.log(`✔ ${dishes.length} plats créés`);

  // ── Paramètres du site (horaires) ─────────────────────
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      hoursLine1: "Service du midi de 12h à 14h.",
      hoursLine2: "Service du soir de 19h à 21h",
      hoursLine3: "Du Lundi au Vendredi",
    },
  });
  console.log("✔ Paramètres du site créés");

  // ── Planning d'ouverture hebdomadaire (par défaut : ouvert tous les jours) ──
  for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
    await prisma.weeklyOpeningHours.upsert({
      where: { dayOfWeek },
      update: {},
      create: { dayOfWeek, lunchOpen: true, dinnerOpen: true },
    });
  }
  console.log("✔ Planning d'ouverture créé");

  // ── Menu du jour ───────────────────────────────────────
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  await prisma.menuOfTheDay.upsert({
    where: { date: today },
    update: {},
    create: {
      date: today,
      starterName: "Velouté de butternut et noisettes torréfiées",
      mainCourseName: "Blanquette de veau à l'ancienne, riz pilaf",
      dessertName: "Île flottante aux pralines roses",
      priceStarterMain: 14.9,
      priceFullMenu: 16.9,
      priceMainDessert: 14.9,
    },
  });
  console.log("✔ Menu du jour créé");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

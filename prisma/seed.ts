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
      name: "Salle Cosy",
      capacity: 50,
      isOutdoor: false,
      sortOrder: 1,
      description: "Notre salle principale avec son espace bar : l'endroit idéal pour un moment convivial entre amis ou en famille, dans une atmosphère chaleureuse et décontractée.",
      imageUrl: "/img/salleprincipale.jpg",
    },
    {
      name: "Salle Romantique",
      capacity: 40,
      isOutdoor: false,
      sortOrder: 2,
      description: "Un cadre raffiné et élégant, pensé pour les repas intimes. Lumières tamisées et décoration soignée font de cette salle le choix parfait pour vos dîners en amoureux ou vos célébrations.",
      imageUrl: "/img/salle2-1024x682.jpg",
    },
    {
      name: "Salle Moderne",
      capacity: 30,
      isOutdoor: false,
      sortOrder: 3,
      description: "Une atmosphère dynamique et contemporaine, idéale pour vos déjeuners d'affaires, réunions d'équipe ou tout événement qui mérite un cadre au goût du jour.",
      imageUrl: "/img/salle3-1024x682.jpg",
    },
    {
      name: "Salle Prestige",
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

  // ── Carte ──────────────────────────────────────────────
  const dishes = [
    { name: "Terrine de campagne maison", description: "Et ses condiments, pickles d'oignons rouges.", price: 8.5, category: "STARTER" as const },
    { name: "Velouté de saison", description: "Légumes du marché, crème fouettée aux herbes.", price: 7.5, category: "STARTER" as const },
    { name: "Salade de chèvre chaud", description: "Miel des Deux-Sèvres, noix et jeunes pousses.", price: 9.0, category: "STARTER" as const },
    { name: "Entrecôte grillée (300g)", description: "Beurre maître d'hôtel, frites maison et salade.", price: 19.5, category: "MAIN" as const },
    { name: "Dos de cabillaud rôti", description: "Beurre blanc, écrasé de pommes de terre.", price: 17.5, category: "MAIN" as const },
    { name: "Suprême de volaille fermière", description: "Jus corsé, légumes de saison.", price: 16.0, category: "MAIN" as const },
    { name: "Risotto crémeux aux champignons", description: "Parmesan affiné 24 mois, huile de truffe.", price: 15.0, category: "MAIN" as const },
    { name: "Crème brûlée à la vanille", description: "Vanille Bourbon de Madagascar.", price: 6.5, category: "DESSERT" as const },
    { name: "Tarte fine aux pommes", description: "Glace vanille, caramel au beurre salé.", price: 7.0, category: "DESSERT" as const },
    { name: "Moelleux au chocolat", description: "Cœur coulant, crème anglaise.", price: 7.5, category: "DESSERT" as const },
  ];
  const dishCount = await prisma.dish.count();
  if (dishCount === 0) {
    await prisma.dish.createMany({ data: dishes });
    console.log(`✔ ${dishes.length} plats créés`);
  }

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
      price: 16.9,
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

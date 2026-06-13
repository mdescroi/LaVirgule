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
  const spaces = [
    {
      name: "Salle 1",
      capacity: 40,
      isOutdoor: false,
      description: "Notre salle principale, lumineuse et chaleureuse.",
      imageUrl: "/img/salle2-1024x682.jpg",
    },
    {
      name: "Salle 2",
      capacity: 30,
      isOutdoor: false,
      description: "Une salle intimiste, idéale pour les repas d'affaires.",
      imageUrl: "/img/salle3-1024x682.jpg",
    },
    {
      name: "Salle 3",
      capacity: 50,
      isOutdoor: false,
      description: "Notre salle de réception, parfaite pour vos groupes et séminaires.",
      imageUrl: "/img/salle-reception-3-1-1024x682.jpg",
    },
    {
      name: "Terrasse",
      capacity: 35,
      isOutdoor: true,
      description: "Notre terrasse extérieure ombragée, pour les beaux jours.",
      imageUrl: "/img/terrasse-1024x682.jpg",
    },
  ];
  for (const s of spaces) {
    await prisma.space.upsert({ where: { name: s.name }, update: s, create: s });
  }
  console.log("✔ 4 espaces créés");

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

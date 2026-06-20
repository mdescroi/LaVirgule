import { prisma } from "@/lib/prisma";
import { HeroSection } from "@/components/site/hero-section";
import { MenuSection } from "@/components/site/menu-section";
import { SpacesCarousel } from "@/components/site/spaces-carousel";
import { HoursSection } from "@/components/site/hours-section";

export const revalidate = 300; // ISR : revalide toutes les 5 minutes

const DEFAULT_HOURS = {
  hoursLine1: "De janvier à août : ouvert uniquement le midi, de 12h à 14h.",
  hoursLine2: "Groupes acceptés le soir à partir de 15 personnes (janv. à août).",
  hoursLine3: "De septembre à décembre : ouvert le midi (12h–14h) et le soir (19h–21h30).",
};

export default async function HomePage() {
  const [spaces, siteSettings] = await Promise.all([
    prisma.space.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []),
    prisma.siteSettings.findUnique({ where: { id: "singleton" } }).catch(() => null),
  ]);

  const hours = siteSettings ?? DEFAULT_HOURS;

  return (
    <>
      <HeroSection />
      <MenuSection />
      <SpacesCarousel
        spaces={spaces.map((s) => ({
          id: s.id,
          name: s.name,
          capacity: s.capacity,
          isOutdoor: s.isOutdoor,
          description: s.description,
          imageUrl: s.imageUrl,
        }))}
      />
      <HoursSection
        hoursLine1={hours.hoursLine1}
        hoursLine2={hours.hoursLine2}
        hoursLine3={hours.hoursLine3}
      />
    </>
  );
}

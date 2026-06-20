import { prisma } from "@/lib/prisma";
import { HeroSection } from "@/components/site/hero-section";
import { MenuSection } from "@/components/site/menu-section";
import { SpacesCarousel } from "@/components/site/spaces-carousel";

export const revalidate = 300; // ISR : revalide toutes les 5 minutes

export default async function HomePage() {
  const spaces = await prisma.space
    .findMany({ orderBy: { sortOrder: "asc" } })
    .catch(() => []);

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
    </>
  );
}

import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { RESTAURANT } from "@/lib/config";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${RESTAURANT.name} — Restaurant à Niort / Chauray`,
    template: `%s | ${RESTAURANT.name}`,
  },
  description:
    "Le restaurant La Virgule vous accueille au 83, rue André Bellot à Chaban / Chauray (Niort). Cuisine traditionnelle, menu du jour, accueil de groupes et séminaires d'entreprise.",
  keywords: [
    "restaurant Niort",
    "restaurant Chauray",
    "La Virgule",
    "menu du jour Niort",
    "séminaire entreprise Niort",
    "repas de groupe",
  ],
  openGraph: {
    title: `${RESTAURANT.name} — Restaurant à Niort / Chauray`,
    description:
      "Cuisine traditionnelle, menu du jour, accueil de groupes et séminaires à Chauray (Niort).",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${playfair.variable} h-full antialiased scroll-smooth`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}

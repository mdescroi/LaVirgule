-- Migration: replace single price with 3 prices on MenuOfTheDay
-- Entrée+Plat / Entrée+Plat+Dessert / Plat+Dessert

ALTER TABLE "menus_of_the_day" ADD COLUMN "priceStarterMain"  DECIMAL(8,2) NOT NULL DEFAULT 14.90;
ALTER TABLE "menus_of_the_day" ADD COLUMN "priceFullMenu"     DECIMAL(8,2) NOT NULL DEFAULT 16.90;
ALTER TABLE "menus_of_the_day" ADD COLUMN "priceMainDessert"  DECIMAL(8,2) NOT NULL DEFAULT 14.90;
ALTER TABLE "menus_of_the_day" DROP COLUMN "price";

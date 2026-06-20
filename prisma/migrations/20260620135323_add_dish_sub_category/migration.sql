-- AlterTable
ALTER TABLE "dishes" ADD COLUMN     "subCategoryId" TEXT;

-- CreateTable
CREATE TABLE "dish_sub_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentCategory" "DishCategory" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dish_sub_categories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "dish_sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

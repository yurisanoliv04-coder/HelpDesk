-- CreateEnum
CREATE TYPE "AssetCategoryKind" AS ENUM ('EQUIPMENT', 'ACCESSORY', 'DISPOSABLE');

-- AlterTable
ALTER TABLE "asset_categories" ADD COLUMN     "kind" "AssetCategoryKind" NOT NULL DEFAULT 'EQUIPMENT';

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "model_id" TEXT;

-- CreateTable
CREATE TABLE "asset_custom_field_defs" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "field_type" TEXT NOT NULL DEFAULT 'text',
    "options" TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_custom_field_defs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_models" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "image_data" TEXT,
    "specs" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_custom_field_defs_category_id_idx" ON "asset_custom_field_defs"("category_id");

-- CreateIndex
CREATE INDEX "asset_models_category_id_idx" ON "asset_models"("category_id");

-- AddForeignKey
ALTER TABLE "asset_custom_field_defs" ADD CONSTRAINT "asset_custom_field_defs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "asset_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_models" ADD CONSTRAINT "asset_models_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "asset_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "asset_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

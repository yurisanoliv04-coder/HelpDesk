-- AlterTable
ALTER TABLE "asset_categories" ADD COLUMN     "is_computer" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "asset_custom_field_defs" ADD COLUMN     "required" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "asset_custom_field_values" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "field_def_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_custom_field_values_asset_id_idx" ON "asset_custom_field_values"("asset_id");

-- CreateIndex
CREATE UNIQUE INDEX "asset_custom_field_values_asset_id_field_def_id_key" ON "asset_custom_field_values"("asset_id", "field_def_id");

-- AddForeignKey
ALTER TABLE "asset_custom_field_values" ADD CONSTRAINT "asset_custom_field_values_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_custom_field_values" ADD CONSTRAINT "asset_custom_field_values_field_def_id_fkey" FOREIGN KEY ("field_def_id") REFERENCES "asset_custom_field_defs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

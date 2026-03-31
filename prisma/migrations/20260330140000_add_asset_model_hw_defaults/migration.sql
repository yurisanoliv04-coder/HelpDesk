-- Add hardware default fields to asset_models
ALTER TABLE "asset_models" ADD COLUMN "cpu_part_id" TEXT;
ALTER TABLE "asset_models" ADD COLUMN "ram_part_id" TEXT;
ALTER TABLE "asset_models" ADD COLUMN "storage_part_id" TEXT;
ALTER TABLE "asset_models" ADD COLUMN "custom_defaults" JSONB;

-- Foreign keys
ALTER TABLE "asset_models" ADD CONSTRAINT "asset_models_cpu_part_id_fkey"
  FOREIGN KEY ("cpu_part_id") REFERENCES "hardware_parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "asset_models" ADD CONSTRAINT "asset_models_ram_part_id_fkey"
  FOREIGN KEY ("ram_part_id") REFERENCES "hardware_parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "asset_models" ADD CONSTRAINT "asset_models_storage_part_id_fkey"
  FOREIGN KEY ("storage_part_id") REFERENCES "hardware_parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

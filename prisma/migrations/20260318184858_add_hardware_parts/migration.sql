-- CreateEnum
CREATE TYPE "HardwarePartType" AS ENUM ('CPU', 'RAM', 'STORAGE');

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "cpu_part_id" TEXT,
ADD COLUMN     "ram_part_id" TEXT,
ADD COLUMN     "storage_part_id" TEXT;

-- CreateTable
CREATE TABLE "hardware_parts" (
    "id" TEXT NOT NULL,
    "type" "HardwarePartType" NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "specs" JSONB,
    "score_points" INTEGER NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hardware_parts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hardware_parts_type_idx" ON "hardware_parts"("type");

-- CreateIndex
CREATE INDEX "hardware_parts_active_idx" ON "hardware_parts"("active");

-- CreateIndex
CREATE INDEX "assets_cpu_part_id_idx" ON "assets"("cpu_part_id");

-- CreateIndex
CREATE INDEX "assets_ram_part_id_idx" ON "assets"("ram_part_id");

-- CreateIndex
CREATE INDEX "assets_storage_part_id_idx" ON "assets"("storage_part_id");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_cpu_part_id_fkey" FOREIGN KEY ("cpu_part_id") REFERENCES "hardware_parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_ram_part_id_fkey" FOREIGN KEY ("ram_part_id") REFERENCES "hardware_parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_storage_part_id_fkey" FOREIGN KEY ("storage_part_id") REFERENCES "hardware_parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

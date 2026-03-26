-- AlterEnum
ALTER TYPE "AssetStatus" ADD VALUE 'IRREGULAR';

-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "buyer_id" TEXT,
ADD COLUMN     "ordered_by_id" TEXT;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_ordered_by_id_fkey" FOREIGN KEY ("ordered_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

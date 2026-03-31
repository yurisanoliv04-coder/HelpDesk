-- AlterTable
ALTER TABLE "asset_categories" ADD COLUMN     "stock_quantity" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "category_stock_movements" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "category_stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_stock_movements_category_id_idx" ON "category_stock_movements"("category_id");

-- AddForeignKey
ALTER TABLE "category_stock_movements" ADD CONSTRAINT "category_stock_movements_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "asset_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_stock_movements" ADD CONSTRAINT "category_stock_movements_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

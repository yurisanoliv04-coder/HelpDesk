-- CreateEnum
CREATE TYPE "OpeningRuleType" AS ENUM ('CONFIRMATION', 'TIME_RESTRICTION', 'DEPARTMENT_ONLY', 'TEMPERATURE_CHECK', 'WARNING_ONLY');

-- CreateTable
CREATE TABLE "category_technicians" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_technicians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_opening_rules" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "rule_type" "OpeningRuleType" NOT NULL,
    "config" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_opening_rules_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "category_technicians_category_id_user_id_key" ON "category_technicians"("category_id", "user_id");

-- CreateIndex
CREATE INDEX "category_technicians_category_id_idx" ON "category_technicians"("category_id");
CREATE INDEX "category_technicians_user_id_idx" ON "category_technicians"("user_id");
CREATE INDEX "ticket_opening_rules_category_id_idx" ON "ticket_opening_rules"("category_id");

-- AddForeignKey
ALTER TABLE "category_technicians" ADD CONSTRAINT "category_technicians_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ticket_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_technicians" ADD CONSTRAINT "category_technicians_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_opening_rules" ADD CONSTRAINT "ticket_opening_rules_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "ticket_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

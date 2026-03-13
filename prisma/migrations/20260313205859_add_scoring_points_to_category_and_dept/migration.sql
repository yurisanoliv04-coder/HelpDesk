-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "scoring_points" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ticket_categories" ADD COLUMN     "scoring_points" INTEGER NOT NULL DEFAULT 0;

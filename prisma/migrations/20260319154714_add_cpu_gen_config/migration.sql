-- CreateTable
CREATE TABLE "cpu_generation_configs" (
    "id" TEXT NOT NULL,
    "min_gen" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "adj" INTEGER NOT NULL,
    "note" TEXT,

    CONSTRAINT "cpu_generation_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cpu_generation_configs_min_gen_key" ON "cpu_generation_configs"("min_gen");

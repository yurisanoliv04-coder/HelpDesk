-- CreateTable
CREATE TABLE "user_dashboards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Dashboard',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "layout" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_dashboards_user_id_idx" ON "user_dashboards"("user_id");

-- CreateIndex
CREATE INDEX "user_dashboards_user_id_is_default_idx" ON "user_dashboards"("user_id", "is_default");

-- AddForeignKey
ALTER TABLE "user_dashboards" ADD CONSTRAINT "user_dashboards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

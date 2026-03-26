-- CreateTable
CREATE TABLE "asset_alert_instances" (
    "id" TEXT NOT NULL,
    "field_def_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_alert_instances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_alert_instances_asset_id_idx" ON "asset_alert_instances"("asset_id");

-- CreateIndex
CREATE INDEX "asset_alert_instances_due_at_dismissed_idx" ON "asset_alert_instances"("due_at", "dismissed");

-- AddForeignKey
ALTER TABLE "asset_alert_instances" ADD CONSTRAINT "asset_alert_instances_field_def_id_fkey" FOREIGN KEY ("field_def_id") REFERENCES "asset_custom_field_defs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_alert_instances" ADD CONSTRAINT "asset_alert_instances_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

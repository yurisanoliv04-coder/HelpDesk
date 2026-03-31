-- CreateEnum
CREATE TYPE "UserEventType" AS ENUM ('PROFILE_CREATED', 'PROFILE_UPDATED', 'DEPT_CHANGED', 'ROLE_CHANGED', 'PROFILE_DEACTIVATED', 'PROFILE_REACTIVATED');

-- CreateTable
CREATE TABLE "user_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "type" "UserEventType" NOT NULL,
    "description" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_events_user_id_idx" ON "user_events"("user_id");

-- CreateIndex
CREATE INDEX "user_events_actor_id_idx" ON "user_events"("actor_id");

-- AddForeignKey
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_events" ADD CONSTRAINT "user_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

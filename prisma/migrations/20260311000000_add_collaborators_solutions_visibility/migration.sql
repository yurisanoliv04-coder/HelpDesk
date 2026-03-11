-- CreateEnum
CREATE TYPE "MessageVisibility" AS ENUM ('PUBLIC', 'TECHNICIANS', 'AUTHOR');

-- AlterEnum: add new event types
ALTER TYPE "TicketEventType" ADD VALUE 'COLLABORATOR_ADDED';
ALTER TYPE "TicketEventType" ADD VALUE 'COLLABORATOR_REMOVED';
ALTER TYPE "TicketEventType" ADD VALUE 'NOTE_ADDED';
ALTER TYPE "TicketEventType" ADD VALUE 'SOLUTION_ADDED';

-- AlterTable ticket_messages: add is_note + visibility, migrate data, drop internal
ALTER TABLE "ticket_messages" ADD COLUMN "is_note" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ticket_messages" ADD COLUMN "visibility" "MessageVisibility" NOT NULL DEFAULT 'PUBLIC';

UPDATE "ticket_messages" SET "is_note" = true, "visibility" = 'TECHNICIANS' WHERE "internal" = true;

ALTER TABLE "ticket_messages" DROP COLUMN "internal";

-- CreateTable ticket_collaborators
CREATE TABLE "ticket_collaborators" (
    "ticket_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_collaborators_pkey" PRIMARY KEY ("ticket_id","user_id")
);

-- CreateTable ticket_solutions
CREATE TABLE "ticket_solutions" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_solutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_collaborators_ticket_id_idx" ON "ticket_collaborators"("ticket_id");
CREATE INDEX "ticket_solutions_category_id_idx" ON "ticket_solutions"("category_id");

-- AddForeignKey
ALTER TABLE "ticket_collaborators" ADD CONSTRAINT "ticket_collaborators_ticket_id_fkey"
    FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_collaborators" ADD CONSTRAINT "ticket_collaborators_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ticket_solutions" ADD CONSTRAINT "ticket_solutions_ticket_id_fkey"
    FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_solutions" ADD CONSTRAINT "ticket_solutions_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "ticket_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ticket_solutions" ADD CONSTRAINT "ticket_solutions_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

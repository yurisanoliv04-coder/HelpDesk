-- CreateEnum
CREATE TYPE "SystemKey" AS ENUM ('DISCORD', 'INUV', 'ONVIO', 'TRELLO', 'CLASSROOM', 'WINDOWS', 'DOMINIO', 'ONECODE', 'MATTERMOST', 'CHAT_ITA');

-- CreateEnum
CREATE TYPE "AccessStatus" AS ENUM ('OK', 'PENDING', 'NA');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "domain_account" TEXT,
ADD COLUMN     "entry_date" TIMESTAMP(3),
ADD COLUMN     "exit_date" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "windows_user" TEXT;

-- CreateTable
CREATE TABLE "user_system_accesses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "system" "SystemKey" NOT NULL,
    "status" "AccessStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_system_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_system_accesses_user_id_idx" ON "user_system_accesses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_system_accesses_user_id_system_key" ON "user_system_accesses"("user_id", "system");

-- AddForeignKey
ALTER TABLE "user_system_accesses" ADD CONSTRAINT "user_system_accesses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

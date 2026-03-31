-- CreateTable
CREATE TABLE "asset_notes" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_files" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_notes_asset_id_idx" ON "asset_notes"("asset_id");

-- CreateIndex
CREATE INDEX "asset_files_asset_id_idx" ON "asset_files"("asset_id");

-- AddForeignKey
ALTER TABLE "asset_notes" ADD CONSTRAINT "asset_notes_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_notes" ADD CONSTRAINT "asset_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_files" ADD CONSTRAINT "asset_files_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_files" ADD CONSTRAINT "asset_files_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

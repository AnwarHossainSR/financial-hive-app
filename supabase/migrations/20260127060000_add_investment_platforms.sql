-- CreateTable
CREATE TABLE "public"."investment_platforms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_platforms_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "public"."investment_projects" ADD COLUMN "platform_id" UUID;

-- AlterTable
ALTER TABLE "public"."investment_entries" ADD COLUMN "image_url" TEXT;
ALTER TABLE "public"."investment_entries" ALTER COLUMN "platform" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."investment_projects" ADD CONSTRAINT "investment_projects_platform_id_fkey" FOREIGN KEY ("platform_id") REFERENCES "public"."investment_platforms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Storage Bucket (if not exists checks are not standard in pure SQL for data, but we can try insert on conflict)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('investment_documents', 'investment_documents', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'investment_documents' );
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'investment_documents' AND auth.role() = 'authenticated' );


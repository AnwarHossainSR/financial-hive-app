-- Consolidated Investment System Migration
-- Covers: Enums, Platforms, Projects, Entries, Bank Statements, RLS, and Storage

-- 1. Create Enums
CREATE TYPE "public"."project_status" AS ENUM ('active', 'completed', 'paused');
CREATE TYPE "public"."entry_status" AS ENUM ('pending', 'active', 'completed', 'withdrawn');

-- 2. Create Tables
CREATE TABLE "public"."investment_platforms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_platforms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."investment_projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "platform_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "total_profit_loss" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "remaining_capital" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_investment" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "public"."project_status" NOT NULL DEFAULT 'active',
    "start_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookId" UUID,

    CONSTRAINT "investment_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."investment_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" TIMESTAMPTZ(6) NOT NULL,
    "platform" TEXT, -- Made optional since we have platform_id in projects
    "investment_type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "public"."entry_status" NOT NULL DEFAULT 'pending',
    "profit_loss" DECIMAL(15,2),
    "withdrawal_date" TIMESTAMPTZ(6),
    "image_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."bank_statements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" TIMESTAMPTZ(6) NOT NULL,
    "total_capital" DECIMAL(15,2) NOT NULL,
    "total_withdrawal" DECIMAL(15,2) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_statements_pkey" PRIMARY KEY ("id")
);

-- 3. Add Foreign Key Constraints
ALTER TABLE "public"."investment_platforms" 
  ADD CONSTRAINT "investment_platforms_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."investment_projects" 
  ADD CONSTRAINT "investment_projects_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."investment_projects" 
  ADD CONSTRAINT "investment_projects_platform_id_fkey" 
  FOREIGN KEY ("platform_id") REFERENCES "public"."investment_platforms"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."investment_projects" 
  ADD CONSTRAINT "investment_projects_bookId_fkey" 
  FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."investment_entries" 
  ADD CONSTRAINT "investment_entries_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."investment_entries" 
  ADD CONSTRAINT "investment_entries_project_id_fkey" 
  FOREIGN KEY ("project_id") REFERENCES "public"."investment_projects"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."bank_statements" 
  ADD CONSTRAINT "bank_statements_project_id_fkey" 
  FOREIGN KEY ("project_id") REFERENCES "public"."investment_projects"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS "idx_investment_platforms_user_id" ON "public"."investment_platforms"("user_id");
CREATE INDEX IF NOT EXISTS "idx_investment_projects_platform_id" ON "public"."investment_projects"("platform_id");
CREATE INDEX IF NOT EXISTS "idx_investment_projects_user_id" ON "public"."investment_projects"("user_id");
CREATE INDEX IF NOT EXISTS "idx_investment_entries_project_id" ON "public"."investment_entries"("project_id");
CREATE INDEX IF NOT EXISTS "idx_investment_entries_user_id" ON "public"."investment_entries"("user_id");

-- 5. Enable Row Level Security (RLS)
ALTER TABLE "public"."investment_platforms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."investment_projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."investment_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bank_statements" ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies
-- Platforms
CREATE POLICY "Users can view their own platforms" ON "public"."investment_platforms" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own platforms" ON "public"."investment_platforms" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own platforms" ON "public"."investment_platforms" FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own platforms" ON "public"."investment_platforms" FOR DELETE USING (auth.uid() = user_id);

-- Projects
CREATE POLICY "Users can view their own projects" ON "public"."investment_projects" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON "public"."investment_projects" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON "public"."investment_projects" FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON "public"."investment_projects" FOR DELETE USING (auth.uid() = user_id);

-- Entries
CREATE POLICY "Users can view their own entries" ON "public"."investment_entries" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own entries" ON "public"."investment_entries" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own entries" ON "public"."investment_entries" FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own entries" ON "public"."investment_entries" FOR DELETE USING (auth.uid() = user_id);

-- Bank Statements
CREATE POLICY "Users can view their own bank statements" ON "public"."bank_statements" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bank statements" ON "public"."bank_statements" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bank statements" ON "public"."bank_statements" FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bank statements" ON "public"."bank_statements" FOR DELETE USING (auth.uid() = user_id);

-- 7. Storage Bucket and Policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('investment_documents', 'investment_documents', true) 
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'investment_documents' );
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'investment_documents' AND auth.role() = 'authenticated' );

-- Fix Investment Hierarchy: Platform -> Projects -> Entries
-- This migration ensures proper relationships and constraints

-- Step 1: Create a default platform for each user who has projects without a platform
DO $$
DECLARE
    user_record RECORD;
    default_platform_id UUID;
BEGIN
    -- For each user who has projects without a platform_id
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM "public"."investment_projects" 
        WHERE platform_id IS NULL
    LOOP
        -- Create a default platform for this user
        INSERT INTO "public"."investment_platforms" (user_id, name, description)
        VALUES (
            user_record.user_id, 
            'Default Platform', 
            'Auto-created platform for existing projects'
        )
        RETURNING id INTO default_platform_id;
        
        -- Assign all projects without a platform to this default platform
        UPDATE "public"."investment_projects"
        SET platform_id = default_platform_id
        WHERE user_id = user_record.user_id AND platform_id IS NULL;
    END LOOP;
END $$;

-- Step 2: Now make platform_id required for investment_projects
-- All projects must belong to a platform
ALTER TABLE "public"."investment_projects" 
  ALTER COLUMN "platform_id" SET NOT NULL;

-- Step 3: Add foreign key constraint for user_id in investment_platforms
ALTER TABLE "public"."investment_platforms" 
  ADD CONSTRAINT "investment_platforms_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Add foreign key constraint for user_id in investment_projects
ALTER TABLE "public"."investment_projects" 
  ADD CONSTRAINT "investment_projects_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Add foreign key constraint for user_id in investment_entries
ALTER TABLE "public"."investment_entries" 
  ADD CONSTRAINT "investment_entries_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Update the platform_id foreign key to CASCADE on delete
-- When a platform is deleted, all its projects should be deleted
ALTER TABLE "public"."investment_projects" 
  DROP CONSTRAINT IF EXISTS "investment_projects_platform_id_fkey";

ALTER TABLE "public"."investment_projects" 
  ADD CONSTRAINT "investment_projects_platform_id_fkey" 
  FOREIGN KEY ("platform_id") REFERENCES "public"."investment_platforms"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 7: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_investment_platforms_user_id" 
  ON "public"."investment_platforms"("user_id");

CREATE INDEX IF NOT EXISTS "idx_investment_projects_platform_id" 
  ON "public"."investment_projects"("platform_id");

CREATE INDEX IF NOT EXISTS "idx_investment_projects_user_id" 
  ON "public"."investment_projects"("user_id");

CREATE INDEX IF NOT EXISTS "idx_investment_entries_project_id" 
  ON "public"."investment_entries"("project_id");

CREATE INDEX IF NOT EXISTS "idx_investment_entries_user_id" 
  ON "public"."investment_entries"("user_id");

-- Step 8: Add RLS (Row Level Security) policies
ALTER TABLE "public"."investment_platforms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."investment_projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."investment_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bank_statements" ENABLE ROW LEVEL SECURITY;

-- Platforms policies
DROP POLICY IF EXISTS "Users can view their own platforms" ON "public"."investment_platforms";
CREATE POLICY "Users can view their own platforms" 
  ON "public"."investment_platforms" FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own platforms" ON "public"."investment_platforms";
CREATE POLICY "Users can create their own platforms" 
  ON "public"."investment_platforms" FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own platforms" ON "public"."investment_platforms";
CREATE POLICY "Users can update their own platforms" 
  ON "public"."investment_platforms" FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own platforms" ON "public"."investment_platforms";
CREATE POLICY "Users can delete their own platforms" 
  ON "public"."investment_platforms" FOR DELETE 
  USING (auth.uid() = user_id);

-- Projects policies
DROP POLICY IF EXISTS "Users can view their own projects" ON "public"."investment_projects";
CREATE POLICY "Users can view their own projects" 
  ON "public"."investment_projects" FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own projects" ON "public"."investment_projects";
CREATE POLICY "Users can create their own projects" 
  ON "public"."investment_projects" FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON "public"."investment_projects";
CREATE POLICY "Users can update their own projects" 
  ON "public"."investment_projects" FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON "public"."investment_projects";
CREATE POLICY "Users can delete their own projects" 
  ON "public"."investment_projects" FOR DELETE 
  USING (auth.uid() = user_id);

-- Entries policies
DROP POLICY IF EXISTS "Users can view their own entries" ON "public"."investment_entries";
CREATE POLICY "Users can view their own entries" 
  ON "public"."investment_entries" FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own entries" ON "public"."investment_entries";
CREATE POLICY "Users can create their own entries" 
  ON "public"."investment_entries" FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own entries" ON "public"."investment_entries";
CREATE POLICY "Users can update their own entries" 
  ON "public"."investment_entries" FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own entries" ON "public"."investment_entries";
CREATE POLICY "Users can delete their own entries" 
  ON "public"."investment_entries" FOR DELETE 
  USING (auth.uid() = user_id);

-- Bank statements policies
DROP POLICY IF EXISTS "Users can view their own bank statements" ON "public"."bank_statements";
CREATE POLICY "Users can view their own bank statements" 
  ON "public"."bank_statements" FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own bank statements" ON "public"."bank_statements";
CREATE POLICY "Users can create their own bank statements" 
  ON "public"."bank_statements" FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bank statements" ON "public"."bank_statements";
CREATE POLICY "Users can update their own bank statements" 
  ON "public"."bank_statements" FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bank statements" ON "public"."bank_statements";
CREATE POLICY "Users can delete their own bank statements" 
  ON "public"."bank_statements" FOR DELETE 
  USING (auth.uid() = user_id);

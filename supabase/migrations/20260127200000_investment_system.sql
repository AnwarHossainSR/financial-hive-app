-- Complete Investment System Migration
-- Drop everything first, then create clean structure

-- 1. Drop existing investment tables and types
DROP TABLE IF EXISTS "public"."bank_statements" CASCADE;
DROP TABLE IF EXISTS "public"."investment_entries" CASCADE;
DROP TABLE IF EXISTS "public"."investment_projects" CASCADE;
DROP TABLE IF EXISTS "public"."investment_platforms" CASCADE;
DROP TYPE IF EXISTS "public"."entry_status" CASCADE;
DROP TYPE IF EXISTS "public"."project_status" CASCADE;

-- 2. Create Enums
CREATE TYPE "public"."project_status" AS ENUM ('active', 'completed', 'paused');
CREATE TYPE "public"."entry_status" AS ENUM ('pending', 'active', 'completed', 'withdrawn');

-- 3. Create Tables
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
    "platform_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "total_profit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_loss" DECIMAL(15,2) NOT NULL DEFAULT 0,
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
    "order_no" INTEGER,
    "order_date" TIMESTAMPTZ(6) NOT NULL,
    "order_id" TEXT,
    "investment_type" TEXT NOT NULL DEFAULT 'Investment',
    "status" "public"."entry_status" NOT NULL DEFAULT 'active',
    "investment_amount" DECIMAL(15,2) NOT NULL,
    "duration_months" INTEGER,
    "roi_min" DECIMAL(5,2),
    "roi_max" DECIMAL(5,2),
    "maturity_date" TIMESTAMPTZ(6),
    "expected_return" DECIMAL(15,2),
    "expected_profit" DECIMAL(15,2),
    "return_amount" DECIMAL(15,2),
    "actual_profit" DECIMAL(15,2),
    "capital_added" DECIMAL(15,2),
    "withdrawal_amount" DECIMAL(15,2),
    "is_completed" BOOLEAN DEFAULT false,
    "notes" TEXT,
    "image_url" TEXT,
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

-- 4. Add Foreign Key Constraints
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
  ON DELETE SET NULL ON UPDATE CASCADE;

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

ALTER TABLE "public"."bank_statements" 
  ADD CONSTRAINT "bank_statements_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Create Indexes
CREATE INDEX "idx_investment_platforms_user_id" ON "public"."investment_platforms"("user_id");
CREATE INDEX "idx_investment_projects_platform_id" ON "public"."investment_projects"("platform_id");
CREATE INDEX "idx_investment_projects_user_id" ON "public"."investment_projects"("user_id");
CREATE INDEX "idx_investment_entries_project_id" ON "public"."investment_entries"("project_id");
CREATE INDEX "idx_investment_entries_user_id" ON "public"."investment_entries"("user_id");
CREATE INDEX "idx_bank_statements_project_id" ON "public"."bank_statements"("project_id");

-- 6. Create automated calculation function
CREATE OR REPLACE FUNCTION calculate_project_totals(project_uuid UUID)
RETURNS void AS $$
DECLARE
    total_inv DECIMAL(15,2) := 0;
    total_prof DECIMAL(15,2) := 0;
    total_loss_val DECIMAL(15,2) := 0;
    total_outflow DECIMAL(15,2) := 0;
    entry_record RECORD;
BEGIN
    FOR entry_record IN 
        SELECT * FROM investment_entries WHERE project_id = project_uuid
    LOOP
        -- Total Investment (Capital Added)
        total_inv := total_inv + COALESCE(entry_record.capital_added, entry_record.investment_amount, 0);
        
        -- Total Profit (Actual Profit)
        total_prof := total_prof + COALESCE(entry_record.actual_profit, 0);
        
        -- Total Outflow (Withdrawals)
        total_outflow := total_outflow + COALESCE(entry_record.withdrawal_amount, 0);
    END LOOP;
    
    UPDATE investment_projects SET
        total_investment = total_inv,
        total_profit = total_prof,
        total_loss = total_loss_val,
        total_profit_loss = total_prof - total_loss_val,
        remaining_capital = GREATEST(0, total_inv + (total_prof - total_loss_val) - total_outflow),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = project_uuid;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to auto-calculate expected values
CREATE OR REPLACE FUNCTION calculate_entry_values()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate maturity date if duration is provided
    IF NEW.duration_months IS NOT NULL AND NEW.order_date IS NOT NULL THEN
        NEW.maturity_date := NEW.order_date + INTERVAL '1 month' * NEW.duration_months;
    END IF;
    
    -- Calculate expected profit and return based on ROI
    IF NEW.investment_amount IS NOT NULL AND NEW.roi_min IS NOT NULL THEN
        NEW.expected_profit := NEW.investment_amount * (NEW.roi_min / 100);
        NEW.expected_return := NEW.investment_amount + NEW.expected_profit;
    END IF;
    
    -- Set capital_added to investment_amount if not provided
    IF NEW.capital_added IS NULL THEN
        NEW.capital_added := NEW.investment_amount;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create triggers for automatic calculation
CREATE OR REPLACE FUNCTION trigger_calculate_project_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_project_totals(OLD.project_id);
        RETURN OLD;
    ELSE
        PERFORM calculate_project_totals(NEW.project_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER investment_entry_auto_calculate_trigger
    BEFORE INSERT OR UPDATE ON investment_entries
    FOR EACH ROW EXECUTE FUNCTION calculate_entry_values();

CREATE TRIGGER investment_entry_totals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON investment_entries
    FOR EACH ROW EXECUTE FUNCTION trigger_calculate_project_totals();

-- 8. Enable Row Level Security (RLS)
ALTER TABLE "public"."investment_platforms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."investment_projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."investment_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bank_statements" ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS Policies
CREATE POLICY "Users can view their own platforms" ON "public"."investment_platforms" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own platforms" ON "public"."investment_platforms" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own platforms" ON "public"."investment_platforms" FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own platforms" ON "public"."investment_platforms" FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own projects" ON "public"."investment_projects" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON "public"."investment_projects" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON "public"."investment_projects" FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON "public"."investment_projects" FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own entries" ON "public"."investment_entries" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own entries" ON "public"."investment_entries" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own entries" ON "public"."investment_entries" FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own entries" ON "public"."investment_entries" FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own bank statements" ON "public"."bank_statements" FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bank statements" ON "public"."bank_statements" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bank statements" ON "public"."bank_statements" FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bank statements" ON "public"."bank_statements" FOR DELETE USING (auth.uid() = user_id);

-- 10. Storage Bucket and Policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('investment_documents', 'investment_documents', true) 
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'investment_documents' );
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'investment_documents' AND auth.role() = 'authenticated' );

-- Clean Database Migration - Financial Hive App
-- This migration is idempotent and can be run multiple times safely
-- Admin user setup moved to seed.js
-- Row-Level Security (RLS) completely removed

-- Create app roles enum (idempotent)
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('owner', 'member', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create book types enum (idempotent)
DO $$ BEGIN
    CREATE TYPE public.book_type AS ENUM ('personal', 'business');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create transaction types enum (idempotent)
DO $$ BEGIN
    CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table for user data (idempotent)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create books table (idempotent)
CREATE TABLE IF NOT EXISTS public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type book_type NOT NULL DEFAULT 'personal',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create book_members table for sharing functionality (idempotent)
CREATE TABLE IF NOT EXISTS public.book_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(book_id, user_id)
);

-- Create transactions table (idempotent)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  category TEXT NOT NULL,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monthly_budgets table (idempotent)
CREATE TABLE IF NOT EXISTS public.monthly_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(book_id, month)
);

-- Create user_settings table (idempotent)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  default_book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  notifications JSONB NOT NULL DEFAULT '{"transactions": true, "books": true, "reports": false, "email": true}',
  export_format VARCHAR(10) NOT NULL DEFAULT 'csv',
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for receipts (idempotent)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Disable Row Level Security on all tables (idempotent)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.books DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;

-- Create function to update timestamps (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to ensure only one default book per user (idempotent)
CREATE OR REPLACE FUNCTION public.ensure_one_default_book()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Reset is_default to false for other books owned by the same user
    UPDATE public.books
    SET is_default = false
    WHERE owner_id = NEW.owner_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Create function to handle new user signup (idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, display_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'user'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    updated_at = now();

  -- Insert default user settings
  INSERT INTO public.user_settings (user_id, default_book_id, notifications, export_format, currency)
  VALUES (
    NEW.id,
    NULL,
    '{"transactions": true, "books": true, "reports": false, "email": true}',
    'csv',
    'USD'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    notifications = EXCLUDED.notifications,
    export_format = EXCLUDED.export_format,
    currency = EXCLUDED.currency,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Create triggers (idempotent - drop first to avoid conflicts)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_books_updated_at ON public.books;
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_monthly_budgets_updated_at ON public.monthly_budgets;
CREATE TRIGGER update_monthly_budgets_updated_at
  BEFORE UPDATE ON public.monthly_budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS ensure_one_default_book_trigger ON public.books;
CREATE TRIGGER ensure_one_default_book_trigger
  BEFORE INSERT OR UPDATE OF is_default
  ON public.books
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.ensure_one_default_book();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create partial unique index to ensure only one default book per user (idempotent)
DROP INDEX IF EXISTS idx_books_unique_default_per_user;
CREATE UNIQUE INDEX idx_books_unique_default_per_user
  ON public.books (owner_id)
  WHERE is_default = true;

-- Create indexes for performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_books_owner_id ON public.books(owner_id);
CREATE INDEX IF NOT EXISTS idx_book_members_book_id ON public.book_members(book_id);
CREATE INDEX IF NOT EXISTS idx_book_members_user_id ON public.book_members(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_book_id ON public.transactions(book_id);
CREATE INDEX IF NOT EXISTS idx_monthly_budgets_book_id ON public.monthly_budgets(book_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Ensure Realtime publication exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END;
$$;

-- Enable Realtime for tables (idempotent)
DO $$
DECLARE 
    table_list text[] := ARRAY['public.books', 'public.transactions', 'public.book_members', 'public.monthly_budgets', 'public.user_settings'];
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY table_list
    LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE %s', table_name);
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors if table is not in publication
        END;
        
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %s', table_name);
        EXCEPTION WHEN OTHERS THEN
            -- Log error but continue
            RAISE NOTICE 'Could not add table % to realtime publication: %', table_name, SQLERRM;
        END;
    END LOOP;
END;
$$;

-- Optional: Debug function to verify auth.uid()
CREATE OR REPLACE FUNCTION public.debug_auth_uid()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT auth.uid()::text;
$$;
-- Clean Database Migration - Financial Hive App
-- This migration is idempotent and can be run multiple times safely

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

-- Enable Row Level Security (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create function to check book access (idempotent)
CREATE OR REPLACE FUNCTION public.has_book_access(book_uuid UUID, access_role app_role DEFAULT 'viewer')
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.books b
    WHERE b.id = book_uuid AND b.owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.book_members bm
    WHERE bm.book_id = book_uuid 
    AND bm.user_id = auth.uid()
    AND (
      CASE access_role
        WHEN 'viewer' THEN bm.role IN ('owner', 'member', 'viewer')
        WHEN 'member' THEN bm.role IN ('owner', 'member')
        WHEN 'owner' THEN bm.role = 'owner'
        ELSE false
      END
    )
  );
$$;

-- Drop all existing policies to avoid conflicts
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop public table policies
    FOR pol IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
    
    -- Drop storage policies
    FOR pol IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id AND role = 'user');

CREATE POLICY "Admins or owners can delete profiles" ON public.profiles
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Books policies
CREATE POLICY "Users can view books they have access to" ON public.books
  FOR SELECT USING (public.has_book_access(id, 'viewer'));

CREATE POLICY "Users can create their own books" ON public.books
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Book owners can update their books" ON public.books
  FOR UPDATE USING (public.has_book_access(id, 'owner'));

CREATE POLICY "Admins or owners can delete books" ON public.books
  FOR DELETE USING (
    public.has_book_access(id, 'owner') OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Book members policies
CREATE POLICY "Users can view book members for accessible books" ON public.book_members
  FOR SELECT USING (public.has_book_access(book_id, 'viewer'));

CREATE POLICY "Book owners can manage members" ON public.book_members
  FOR ALL USING (public.has_book_access(book_id, 'owner'));

CREATE POLICY "Admins can delete book members" ON public.book_members
  FOR DELETE USING (
    public.has_book_access(book_id, 'owner') OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Transactions policies
CREATE POLICY "Users can view transactions for accessible books" ON public.transactions
  FOR SELECT USING (public.has_book_access(book_id, 'viewer'));

CREATE POLICY "Users can create transactions for accessible books" ON public.transactions
  FOR INSERT WITH CHECK (
    public.has_book_access(book_id, 'member') AND 
    auth.uid() = user_id
  );

CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING (
    public.has_book_access(book_id, 'member') AND 
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete their own transactions" ON public.transactions
  FOR DELETE USING (
    (public.has_book_access(book_id, 'member') AND auth.uid() = user_id) OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Monthly budgets policies
CREATE POLICY "Users can view budgets for accessible books" ON public.monthly_budgets
  FOR SELECT USING (public.has_book_access(book_id, 'viewer'));

CREATE POLICY "Book owners and members can manage budgets" ON public.monthly_budgets
  FOR ALL USING (public.has_book_access(book_id, 'member'));

CREATE POLICY "Admins can delete budgets" ON public.monthly_budgets
  FOR DELETE USING (
    public.has_book_access(book_id, 'owner') OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- User settings policies
CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON public.user_settings
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Storage policies for receipts
CREATE POLICY "Users can view receipts for accessible transactions" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipts' AND 
    EXISTS (
      SELECT 1 FROM public.transactions t 
      WHERE t.image_url = 'receipts/' || name 
      AND public.has_book_access(t.book_id, 'viewer')
    )
  );

CREATE POLICY "Users can upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own receipts" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'receipts' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own receipts" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'receipts' AND (
      auth.uid()::text = (storage.foldername(name))[1] OR
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() AND p.role = 'admin'
      )
    )
  );

-- Create function to update timestamps (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to prevent role update (idempotent)
CREATE OR REPLACE FUNCTION public.prevent_role_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role != OLD.role THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Only admins can update the role column';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
  );

  -- Insert default user settings
  INSERT INTO public.user_settings (user_id, default_book_id, notifications, export_format, currency)
  VALUES (
    NEW.id,
    NULL,
    '{"transactions": true, "books": true, "reports": false, "email": true}',
    'csv',
    'USD'
  );

  RETURN NEW;
END;
$$;

-- Create triggers (idempotent - drop first to avoid conflicts)
DROP TRIGGER IF EXISTS prevent_role_update_trigger ON public.profiles;
CREATE TRIGGER prevent_role_update_trigger
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_update();

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

-- Setup admin user (idempotent)
DO $$
DECLARE
  admin_uuid UUID;
  admin_email TEXT := 'mahedianwar@gmail.com';
BEGIN
  -- Check if admin user already exists in auth.users
  SELECT id INTO admin_uuid 
  FROM auth.users 
  WHERE email = admin_email;
  
  -- If user doesn't exist, create it
  IF admin_uuid IS NULL THEN
    admin_uuid := gen_random_uuid();
    
    -- Insert into auth.users (this might fail due to permissions)
    BEGIN
      INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        role
      ) VALUES (
        admin_uuid,
        admin_email,
        crypt('&9~4$)50Fl2', gen_salt('bf')),
        now(),
        now(),
        now(),
        'authenticated'
      );
      
      RAISE NOTICE 'Created new admin user in auth.users with ID: %', admin_uuid;
    EXCEPTION 
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'Cannot insert into auth.users due to permissions. Create user manually in Supabase dashboard with email: %', admin_email;
        -- Don't continue if we can't create the auth user
        RETURN;
      WHEN unique_violation THEN
        -- Get the existing user ID
        SELECT id INTO admin_uuid FROM auth.users WHERE email = admin_email;
        RAISE NOTICE 'Admin user already exists in auth.users with ID: %', admin_uuid;
    END;
  ELSE
    RAISE NOTICE 'Admin user already exists with ID: %', admin_uuid;
  END IF;

  -- Insert or update admin profile (idempotent)
  INSERT INTO public.profiles (
    id,
    user_id,
    display_name,
    email,
    role,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    admin_uuid,
    'Admin User',
    admin_email,
    'admin',
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = now();

  -- Insert or update default user settings for admin (idempotent)
  INSERT INTO public.user_settings (
    id,
    user_id,
    default_book_id,
    notifications,
    export_format,
    currency,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    admin_uuid,
    NULL,
    '{"transactions": true, "books": true, "reports": false, "email": true}',
    'csv',
    'USD',
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    notifications = EXCLUDED.notifications,
    export_format = EXCLUDED.export_format,
    currency = EXCLUDED.currency,
    updated_at = now();
    
  RAISE NOTICE 'Admin profile and settings configured successfully';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error setting up admin user: %', SQLERRM;
END;
$$;
-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('owner', 'member', 'viewer');

-- Create book types enum
CREATE TYPE public.book_type AS ENUM ('personal', 'business');

-- Create transaction types enum
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type book_type NOT NULL DEFAULT 'personal',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create book_members table for sharing functionality
CREATE TABLE public.book_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(book_id, user_id)
);

-- Create transactions table
CREATE TABLE public.transactions (
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

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create function to check book access
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

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Books policies
CREATE POLICY "Users can view books they have access to" ON public.books
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.book_members bm 
      WHERE bm.book_id = id AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own books" ON public.books
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Book owners can update their books" ON public.books
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Book owners can delete their books" ON public.books
  FOR DELETE USING (auth.uid() = owner_id);

-- Book members policies
CREATE POLICY "Users can view book members for books they have access to" ON public.book_members
  FOR SELECT USING (public.has_book_access(book_id, 'viewer'));

CREATE POLICY "Book owners can manage members" ON public.book_members
  FOR ALL USING (public.has_book_access(book_id, 'owner'));

-- Transactions policies
CREATE POLICY "Users can view transactions for books they have access to" ON public.transactions
  FOR SELECT USING (public.has_book_access(book_id, 'viewer'));

CREATE POLICY "Users can create transactions for books they have member access to" ON public.transactions
  FOR INSERT WITH CHECK (
    public.has_book_access(book_id, 'member') AND 
    auth.uid() = user_id
  );

CREATE POLICY "Users can update their own transactions in accessible books" ON public.transactions
  FOR UPDATE USING (
    public.has_book_access(book_id, 'member') AND 
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete their own transactions in accessible books" ON public.transactions
  FOR DELETE USING (
    public.has_book_access(book_id, 'member') AND 
    auth.uid() = user_id
  );

-- Storage policies for receipts
CREATE POLICY "Users can view receipts for transactions they have access to" ON storage.objects
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
    bucket_id = 'receipts' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.books;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.book_members;
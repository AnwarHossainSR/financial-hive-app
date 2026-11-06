-- Migration: Shared books for transactions + one overall monthly budget
-- Created at: 2026-11-06
-- Description:
--   1. transaction_books: a transaction can also appear in (and count toward)
--      other books besides its own.
--   2. user_budgets: one monthly budget per user across all books. A month
--      with no row uses the latest earlier month's amount (handled in the app).
--      Seeded from the existing per-book budgets so nothing is lost; the old
--      monthly_budgets table is left in place.
--   3. Indexes for transaction lists and totals, which always filter by user
--      (or book) and sort by date; until now every query scanned the table.
-- Idempotent: safe to run more than once.

-- 1. Shared books ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.transaction_books (
  transaction_id UUID NOT NULL
    REFERENCES public.transactions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  book_id UUID NOT NULL
    REFERENCES public.books(id) ON DELETE CASCADE ON UPDATE CASCADE,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT transaction_books_pkey PRIMARY KEY (transaction_id, book_id)
);

-- Book pages look transactions up by book
CREATE INDEX IF NOT EXISTS transaction_books_book_id_idx
  ON public.transaction_books (book_id);

ALTER TABLE public.transaction_books DISABLE ROW LEVEL SECURITY;

-- 2. Overall monthly budget ----------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  amount DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT user_budgets_user_id_month_key UNIQUE (user_id, month)
);

ALTER TABLE public.user_budgets DISABLE ROW LEVEL SECURITY;

-- Start each month's overall budget at the sum of that month's book budgets
INSERT INTO public.user_budgets (user_id, month, amount)
SELECT b.owner_id, mb.month, SUM(mb.amount)
FROM public.monthly_budgets mb
JOIN public.books b ON b.id = mb.book_id
GROUP BY b.owner_id, mb.month
ON CONFLICT (user_id, month) DO NOTHING;

-- 3. Indexes for transaction queries ----------------------------------------

CREATE INDEX IF NOT EXISTS transactions_user_id_date_idx
  ON public.transactions (user_id, date DESC);

CREATE INDEX IF NOT EXISTS transactions_book_id_date_idx
  ON public.transactions (book_id, date DESC);

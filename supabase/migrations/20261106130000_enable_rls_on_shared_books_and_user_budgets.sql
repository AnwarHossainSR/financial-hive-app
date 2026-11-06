-- Migration: Turn row-level security on for transaction_books and user_budgets
-- Created at: 2026-11-06
-- Description:
--   20261106120000 created these two tables with RLS disabled. In Supabase
--   that leaves them readable and writable by anyone holding the public anon
--   key, through the REST API. The app only reaches them through Prisma, which
--   connects as the table owner and is not affected by RLS (the investment
--   tables already work this way). With RLS on and no policies, the public API
--   gets no rows and cannot write.
-- Idempotent: safe to run more than once. Changes no data.

ALTER TABLE public.transaction_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_budgets ENABLE ROW LEVEL SECURITY;

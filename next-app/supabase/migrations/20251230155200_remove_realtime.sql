-- Migration: Remove Realtime from app tables
-- Created at: 2025-12-30 15:52:00
-- Description: Ensures all app tables are removed from the supabase_realtime publication to reduce overhead and focus on REST/Query patterns.

DO $$
BEGIN
    -- Remove tables from the supabase_realtime publication
    -- Using individual blocks to handle cases where publication might not exist or tables are already removed
    
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.books;
    EXCEPTION WHEN OTHERS THEN 
        RAISE NOTICE 'Skipped dropping public.books from publication: %', SQLERRM;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.transactions;
    EXCEPTION WHEN OTHERS THEN 
        RAISE NOTICE 'Skipped dropping public.transactions from publication: %', SQLERRM;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.book_members;
    EXCEPTION WHEN OTHERS THEN 
        RAISE NOTICE 'Skipped dropping public.book_members from publication: %', SQLERRM;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.monthly_budgets;
    EXCEPTION WHEN OTHERS THEN 
        RAISE NOTICE 'Skipped dropping public.monthly_budgets from publication: %', SQLERRM;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.user_settings;
    EXCEPTION WHEN OTHERS THEN 
        RAISE NOTICE 'Skipped dropping public.user_settings from publication: %', SQLERRM;
    END;

    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
    EXCEPTION WHEN OTHERS THEN 
        RAISE NOTICE 'Skipped dropping public.notifications from publication: %', SQLERRM;
    END;
END;
$$;

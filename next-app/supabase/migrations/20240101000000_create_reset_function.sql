-- Enhanced Database Reset Function
-- This function provides a complete database reset with better error handling
CREATE OR REPLACE FUNCTION complete_database_reset()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE 
    r RECORD;
    result_obj jsonb := '{}';
    steps_completed text[] := ARRAY[]::text[];
    errors_encountered text[] := ARRAY[]::text[];
    tables_dropped integer := 0;
    policies_dropped integer := 0;
    functions_dropped integer := 0;
    triggers_dropped integer := 0;
    types_dropped integer := 0;
    step_name text;
BEGIN
    -- Step 1: Drop all RLS policies (including storage policies)
    step_name := 'Dropping RLS policies';
    BEGIN
        -- Drop policies on public schema tables
        FOR r IN (
            SELECT schemaname, tablename, policyname 
            FROM pg_policies 
            WHERE schemaname = 'public'
        ) LOOP
            BEGIN
                EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', r.policyname, r.schemaname, r.tablename);
                policies_dropped := policies_dropped + 1;
            EXCEPTION WHEN OTHERS THEN
                errors_encountered := array_append(errors_encountered, 
                    format('Failed to drop policy %s on %s.%s: %s', r.policyname, r.schemaname, r.tablename, SQLERRM));
            END;
        END LOOP;
        
        -- Drop storage policies
        FOR r IN (
            SELECT policyname 
            FROM pg_policies 
            WHERE schemaname = 'storage' AND tablename = 'objects'
        ) LOOP
            BEGIN
                EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects CASCADE', r.policyname);
                policies_dropped := policies_dropped + 1;
            EXCEPTION WHEN OTHERS THEN
                errors_encountered := array_append(errors_encountered, 
                    format('Failed to drop storage policy %s: %s', r.policyname, SQLERRM));
            END;
        END LOOP;
        
        steps_completed := array_append(steps_completed, format('%s: Dropped %s policies', step_name, policies_dropped));
    EXCEPTION WHEN OTHERS THEN
        errors_encountered := array_append(errors_encountered, step_name || ': ' || SQLERRM);
    END;

    -- Step 2: Disable RLS on all public tables
    step_name := 'Disabling RLS';
    BEGIN
        FOR r IN (
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        ) LOOP
            BEGIN
                EXECUTE format('ALTER TABLE IF EXISTS public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
            EXCEPTION WHEN OTHERS THEN
                errors_encountered := array_append(errors_encountered, 
                    format('Failed to disable RLS on public.%s: %s', r.tablename, SQLERRM));
            END;
        END LOOP;
        
        steps_completed := array_append(steps_completed, step_name || ': Disabled RLS on all public tables');
    EXCEPTION WHEN OTHERS THEN 
        errors_encountered := array_append(errors_encountered, step_name || ': ' || SQLERRM);
    END;

    -- Step 3: Drop all triggers
    step_name := 'Dropping triggers';
    BEGIN
        FOR r IN (
            SELECT trigger_name, event_object_table
            FROM information_schema.triggers
            WHERE event_object_schema = 'public'
            AND trigger_name NOT LIKE 'RI_%' -- Skip foreign key constraint triggers
        ) LOOP
            BEGIN
                EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I CASCADE', r.trigger_name, r.event_object_table);
                triggers_dropped := triggers_dropped + 1;
            EXCEPTION WHEN OTHERS THEN
                errors_encountered := array_append(errors_encountered, 
                    format('Failed to drop trigger %s: %s', r.trigger_name, SQLERRM));
            END;
        END LOOP;
        
        steps_completed := array_append(steps_completed, format('%s: Dropped %s triggers', step_name, triggers_dropped));
    EXCEPTION WHEN OTHERS THEN
        errors_encountered := array_append(errors_encountered, step_name || ': ' || SQLERRM);
    END;

    -- Step 4: Drop all functions (except system functions and this reset function)
    step_name := 'Dropping functions';
    BEGIN
        FOR r IN (
            SELECT p.proname as function_name,
                   pg_get_function_identity_arguments(p.oid) as args
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' 
            AND p.proname NOT IN ('complete_database_reset')
            AND NOT p.proisagg -- Exclude aggregate functions
        ) LOOP
            BEGIN
                EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', r.function_name, r.args);
                functions_dropped := functions_dropped + 1;
            EXCEPTION WHEN OTHERS THEN
                errors_encountered := array_append(errors_encountered, 
                    format('Failed to drop function %s: %s', r.function_name, SQLERRM));
            END;
        END LOOP;
        
        steps_completed := array_append(steps_completed, format('%s: Dropped %s functions', step_name, functions_dropped));
    EXCEPTION WHEN OTHERS THEN
        errors_encountered := array_append(errors_encountered, step_name || ': ' || SQLERRM);
    END;

    -- Step 5: Remove tables from Realtime publication and drop it
    step_name := 'Dropping Realtime publication';
    BEGIN
        IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
            -- Remove all tables from publication first
            FOR r IN (
                SELECT schemaname, tablename 
                FROM pg_publication_tables 
                WHERE pubname = 'supabase_realtime'
            ) LOOP
                BEGIN
                    EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE %I.%I', r.schemaname, r.tablename);
                EXCEPTION WHEN OTHERS THEN
                    -- Ignore errors here as table might not exist
                END;
            END LOOP;
            
            -- Drop the publication
            DROP PUBLICATION IF EXISTS supabase_realtime;
            steps_completed := array_append(steps_completed, step_name || ': Dropped Realtime publication');
        ELSE
            steps_completed := array_append(steps_completed, step_name || ': No Realtime publication to drop');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        errors_encountered := array_append(errors_encountered, step_name || ': ' || SQLERRM);
    END;

    -- Step 6: Drop all views
    step_name := 'Dropping views';
    BEGIN
        FOR r IN (
            SELECT table_name
            FROM information_schema.views
            WHERE table_schema = 'public'
        ) LOOP
            BEGIN
                EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', r.table_name);
            EXCEPTION WHEN OTHERS THEN
                errors_encountered := array_append(errors_encountered, 
                    format('Failed to drop view %s: %s', r.table_name, SQLERRM));
            END;
        END LOOP;
        
        steps_completed := array_append(steps_completed, step_name || ': Dropped all views');
    EXCEPTION WHEN OTHERS THEN
        errors_encountered := array_append(errors_encountered, step_name || ': ' || SQLERRM);
    END;

    -- Step 7: Drop all tables in correct order (respecting foreign keys)
    step_name := 'Dropping tables';
    BEGIN
        -- Drop tables in reverse dependency order
        DROP TABLE IF EXISTS public.monthly_budgets CASCADE;
        DROP TABLE IF EXISTS public.transactions CASCADE;
        DROP TABLE IF EXISTS public.book_members CASCADE;
        DROP TABLE IF EXISTS public.user_settings CASCADE;
        DROP TABLE IF EXISTS public.books CASCADE;
        DROP TABLE IF EXISTS public.profiles CASCADE;
        
        -- Drop any remaining tables
        FOR r IN (
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        ) LOOP
            BEGIN
                EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', r.tablename);
                tables_dropped := tables_dropped + 1;
            EXCEPTION WHEN OTHERS THEN
                errors_encountered := array_append(errors_encountered, 
                    format('Failed to drop table %s: %s', r.tablename, SQLERRM));
            END;
        END LOOP;
        
        steps_completed := array_append(steps_completed, format('%s: Dropped tables', step_name));
    EXCEPTION WHEN OTHERS THEN
        errors_encountered := array_append(errors_encountered, step_name || ': ' || SQLERRM);
    END;

    -- Step 8: Drop all custom types/enums
    step_name := 'Dropping custom types';
    BEGIN
        FOR r IN (
            SELECT typname 
            FROM pg_type 
            WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND typtype = 'e'
        ) LOOP
            BEGIN
                EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', r.typname);
                types_dropped := types_dropped + 1;
            EXCEPTION WHEN OTHERS THEN
                errors_encountered := array_append(errors_encountered, 
                    format('Failed to drop type %s: %s', r.typname, SQLERRM));
            END;
        END LOOP;
        
        steps_completed := array_append(steps_completed, format('%s: Dropped %s custom types', step_name, types_dropped));
    EXCEPTION WHEN OTHERS THEN
        errors_encountered := array_append(errors_encountered, step_name || ': ' || SQLERRM);
    END;

    -- Step 9: Drop all sequences
    step_name := 'Dropping sequences';
    BEGIN
        FOR r IN (
            SELECT sequence_name 
            FROM information_schema.sequences 
            WHERE sequence_schema = 'public'
        ) LOOP
            BEGIN
                EXECUTE format('DROP SEQUENCE IF EXISTS public.%I CASCADE', r.sequence_name);
            EXCEPTION WHEN OTHERS THEN
                errors_encountered := array_append(errors_encountered, 
                    format('Failed to drop sequence %s: %s', r.sequence_name, SQLERRM));
            END;
        END LOOP;
        
        steps_completed := array_append(steps_completed, step_name || ': Dropped all sequences');
    EXCEPTION WHEN OTHERS THEN
        errors_encountered := array_append(errors_encountered, step_name || ': ' || SQLERRM);
    END;

    -- Step 10: Clear storage data
    step_name := 'Clearing storage';
    BEGIN
        DELETE FROM storage.objects WHERE bucket_id IS NOT NULL;
        DELETE FROM storage.buckets WHERE id IS NOT NULL;
        steps_completed := array_append(steps_completed, step_name || ': Cleared all storage objects and buckets');
    EXCEPTION WHEN OTHERS THEN
        errors_encountered := array_append(errors_encountered, step_name || ': ' || SQLERRM);
    END;

    -- Build result object
    result_obj := jsonb_build_object(
        'success', true,
        'message', 'Database reset completed',
        'steps_completed', steps_completed,
        'errors', errors_encountered,
        'summary', jsonb_build_object(
            'tables_dropped', tables_dropped,
            'policies_dropped', policies_dropped,
            'functions_dropped', functions_dropped,
            'triggers_dropped', triggers_dropped,
            'types_dropped', types_dropped
        )
    );

    RETURN result_obj;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'steps_completed', steps_completed,
        'errors', errors_encountered
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION complete_database_reset() TO authenticated;

-- Add a comment
COMMENT ON FUNCTION complete_database_reset() IS 'Completely resets the database by dropping all user-created objects. Enhanced version with better error handling.';
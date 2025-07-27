import { createClient } from "@supabase/supabase-js";
import * as readline from "node:readline";

// Initialize Supabase admin client with service role key
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "your-supabase-url";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "❌ VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY is not defined in .env"
  );
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function setupResetFunction() {
  console.log("🔧 Setting up enhanced reset function...");

  const resetFunctionSQL = `
-- Enhanced Database Reset Function
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
  `;

  try {
    const { error } = await supabaseAdmin.rpc("exec", {
      sql: resetFunctionSQL,
    });
    if (error) {
      console.error("❌ Failed to create reset function:", error.message);
      return false;
    }
    console.log("✅ Enhanced reset function created successfully");
    return true;
  } catch (err) {
    console.error("❌ Error setting up reset function:", err.message);
    return false;
  }
}

async function performCompleteReset() {
  console.log("🚨 Starting COMPLETE database reset...");
  console.log("⚠️  This will remove EVERYTHING from your database!");
  console.log("📝 Make sure you have backups if needed!\n");

  try {
    // Step 1: Delete all users from auth.users
    console.log("🔥 Step 1: Deleting all users from auth.users...");
    const { data: users, error: listUsersError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listUsersError) {
      console.warn(`Warning listing users: ${listUsersError.message}`);
    } else {
      let deletedCount = 0;
      for (const user of users.users) {
        const { error: deleteUserError } =
          await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (deleteUserError) {
          console.warn(
            `Failed to delete user ${user.id}: ${deleteUserError.message}`
          );
        } else {
          deletedCount++;
        }
      }
      console.log(
        `✅ Deleted ${deletedCount}/${users.users.length} users from auth.users\n`
      );
    }

    // Step 2: Execute complete schema reset using the enhanced function
    console.log("🔧 Step 2: Executing complete schema reset...");
    try {
      const { data: resetResult, error: resetError } = await supabaseAdmin.rpc(
        "complete_database_reset"
      );

      if (resetError) {
        console.error(`❌ Schema reset failed: ${resetError.message}`);
        return false;
      } else {
        console.log("✅ Schema reset completed successfully!");
        console.log("\n📊 Reset Summary:");
        console.log(
          `   Steps completed: ${resetResult.steps_completed?.length || 0}`
        );
        console.log(
          `   Errors encountered: ${resetResult.errors?.length || 0}`
        );

        if (resetResult.summary) {
          const summary = resetResult.summary;
          console.log(`   Tables dropped: ${summary.tables_dropped || 0}`);
          console.log(`   Policies dropped: ${summary.policies_dropped || 0}`);
          console.log(
            `   Functions dropped: ${summary.functions_dropped || 0}`
          );
          console.log(`   Triggers dropped: ${summary.triggers_dropped || 0}`);
          console.log(`   Types dropped: ${summary.types_dropped || 0}`);
        }

        if (resetResult.errors && resetResult.errors.length > 0) {
          console.log("\n⚠️  Some errors occurred:");
          resetResult.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
          });
        }

        console.log("\n📋 Steps completed:");
        resetResult.steps_completed?.forEach((step, index) => {
          console.log(`   ${index + 1}. ${step}`);
        });
      }
    } catch (schemaError) {
      console.error(`❌ Schema reset function failed: ${schemaError.message}`);
      return false;
    }

    console.log("\n🎉 COMPLETE DATABASE RESET FINISHED!");
    console.log("🔄 Your database should now be completely clean.");
    return true;
  } catch (error) {
    console.error("\n❌ Complete reset failed:", error.message);
    return false;
  }
}

// Add confirmation prompt
function askForConfirmation() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("⚠️  WARNING: This will completely wipe your database!");
    console.log("🔥 ALL data, tables, functions, and schema will be deleted!");
    console.log("📝 Make sure you have backups if you need them.\n");

    rl.question(
      'Are you absolutely sure you want to continue? Type "YES DELETE EVERYTHING" to confirm: ',
      (answer) => {
        rl.close();
        resolve(answer === "YES DELETE EVERYTHING");
      }
    );
  });
}

// Execute the complete reset and migration with confirmation
async function main() {
  try {
    const confirmed = await askForConfirmation();

    if (!confirmed) {
      console.log("❌ Reset cancelled. Database unchanged.");
      process.exit(0);
    }

    // Step 1: Setup the enhanced reset function
    const resetFunctionReady = await setupResetFunction();
    if (!resetFunctionReady) {
      console.error("❌ Failed to setup reset function. Aborting.");
      process.exit(1);
    }

    // Step 2: Perform the complete reset
    const resetSuccess = await performCompleteReset();
    if (!resetSuccess) {
      console.error("❌ Reset failed. Check the logs above.");
      process.exit(1);
    }

    // Step 3: Inform user about next steps
    console.log("\n📝 Next steps:");
    console.log(
      "1. Replace your current migration file with the idempotent version"
    );
    console.log("2. Run: npx supabase db push");
    console.log(
      "3. Your database will be recreated with proper error handling"
    );
    console.log(
      "\n💡 The new migration is designed to handle existing objects gracefully."
    );
  } catch (error) {
    console.error("❌ Process failed:", error);
    process.exit(1);
  }
}

// Only ask for confirmation if not in CI/automated environment
if (process.env.CI || process.env.AUTOMATED_RESET) {
  (async () => {
    const resetFunctionReady = await setupResetFunction();
    if (resetFunctionReady) {
      await performCompleteReset();
    }
  })().catch((error) => {
    console.error("❌ Automated reset failed:", error);
    process.exit(1);
  });
} else {
  main();
}

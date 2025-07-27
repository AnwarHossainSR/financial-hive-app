#!/usr/bin/env node

/**
 * Database Seeding Script for Financial Hive App
 *
 * This script creates admin users and initial seed data using Supabase Auth API
 * Run with: node seed.js [--env=production|development]
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Configuration based on environment
const config = {
  development: {
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    serviceRoleKey: process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    admin: {
      email: "mahedianwar@gmail.com",
      password: "&9~4$)50Fl2",
      displayName: "Mahedi Anwar (Admin)",
    },
  },
  production: {
    supabaseUrl: process.env.SUPABASE_URL_PROD || process.env.SUPABASE_URL,
    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY_PROD ||
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    admin: {
      email: "mahedianwar@gmail.com",
      password: process.env.ADMIN_PASSWORD || "&9~4$)50Fl2",
      displayName: "Mahedi Anwar (Admin)",
    },
  },
};

// Get environment (default: development)
const env =
  process.argv.find((arg) => arg.startsWith("--env="))?.split("=")[1] ||
  "development";
const currentConfig = config[env];

if (!currentConfig.supabaseUrl || !currentConfig.serviceRoleKey) {
  console.error(
    "❌ Missing Supabase configuration. Please check your environment variables:"
  );
  console.error("   - SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Initialize Supabase client with service role
const supabase = createClient(
  currentConfig.supabaseUrl,
  currentConfig.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Create admin user
 */
async function createAdminUser() {
  console.log("🔧 Creating admin user...");

  const { admin } = currentConfig;

  try {
    // Check if user already exists
    const { data: existingUsers, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const existingUser = existingUsers.users.find(
      (user) => user.email === admin.email
    );

    if (existingUser) {
      console.log(`✅ Admin user already exists: ${admin.email}`);
      return existingUser;
    }

    // Create the admin user
    const { data: userData, error: createError } =
      await supabase.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
        user_metadata: {
          display_name: admin.displayName,
          role: "admin",
        },
      });

    if (createError) {
      throw new Error(`Failed to create admin user: ${createError.message}`);
    }

    console.log(`✅ Admin user created successfully: ${admin.email}`);
    return userData.user;
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    throw error;
  }
}

/**
 * Update user profile to admin role
 */
async function updateAdminProfile(userId) {
  console.log("🔧 Updating admin profile...");

  try {
    // First, temporarily disable RLS to allow admin role update
    await supabase.rpc("exec", {
      sql: `
        -- Temporarily disable the role update trigger
        DROP TRIGGER IF EXISTS prevent_role_update_trigger ON public.profiles;
      `,
    });

    // Update the profile to admin role
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        role: "admin",
        display_name: currentConfig.admin.displayName,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    // Re-enable the role update trigger
    await supabase.rpc("exec", {
      sql: `
        -- Recreate the role update prevention trigger
        CREATE TRIGGER prevent_role_update_trigger
          BEFORE UPDATE OF role ON public.profiles
          FOR EACH ROW
          EXECUTE FUNCTION public.prevent_role_update();
      `,
    });

    console.log("✅ Admin profile updated successfully");
  } catch (error) {
    console.error("❌ Error updating admin profile:", error.message);
    throw error;
  }
}

/**
 * Create sample data for development
 */
async function createSampleData(adminUserId) {
  if (env !== "development") {
    console.log("⏭️  Skipping sample data creation (not in development mode)");
    return;
  }

  console.log("🔧 Creating sample data...");

  try {
    // Create a sample book
    const { data: bookData, error: bookError } = await supabase
      .from("books")
      .insert({
        name: "Personal Finance",
        type: "personal",
        owner_id: adminUserId,
        description: "Sample personal finance book",
        is_default: true,
      })
      .select()
      .single();

    if (bookError) {
      throw new Error(`Failed to create sample book: ${bookError.message}`);
    }

    console.log("✅ Sample book created");

    // Create sample transactions
    const sampleTransactions = [
      {
        book_id: bookData.id,
        user_id: adminUserId,
        type: "expense",
        amount: 50.0,
        category: "Groceries",
        note: "Weekly grocery shopping",
        date: "2025-07-20",
      },
      {
        book_id: bookData.id,
        user_id: adminUserId,
        type: "income",
        amount: 3000.0,
        category: "Salary",
        note: "Monthly salary",
        date: "2025-07-01",
      },
      {
        book_id: bookData.id,
        user_id: adminUserId,
        type: "expense",
        amount: 25.99,
        category: "Transportation",
        note: "Bus fare",
        date: "2025-07-25",
      },
    ];

    const { error: transactionError } = await supabase
      .from("transactions")
      .insert(sampleTransactions);

    if (transactionError) {
      throw new Error(
        `Failed to create sample transactions: ${transactionError.message}`
      );
    }

    console.log("✅ Sample transactions created");

    // Create sample budget
    const { error: budgetError } = await supabase
      .from("monthly_budgets")
      .insert({
        book_id: bookData.id,
        month: "2025-07",
        amount: 2000.0,
      });

    if (budgetError) {
      throw new Error(`Failed to create sample budget: ${budgetError.message}`);
    }

    console.log("✅ Sample budget created");
  } catch (error) {
    console.error("❌ Error creating sample data:", error.message);
    throw error;
  }
}

/**
 * Verify the setup
 */
async function verifySetup() {
  console.log("🔍 Verifying setup...");

  try {
    // Check admin user
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", currentConfig.admin.email)
      .single();

    if (profileError) {
      throw new Error(
        `Failed to verify admin profile: ${profileError.message}`
      );
    }

    if (profileData.role !== "admin") {
      throw new Error("Admin user does not have admin role");
    }

    console.log("✅ Admin profile verified");

    // Check user settings
    const { data: settingsData, error: settingsError } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", profileData.user_id)
      .single();

    if (settingsError) {
      throw new Error(
        `Failed to verify user settings: ${settingsError.message}`
      );
    }

    console.log("✅ User settings verified");

    if (env === "development") {
      // Check sample data
      const { data: booksData, error: booksError } = await supabase
        .from("books")
        .select("*, transactions(*), monthly_budgets(*)")
        .eq("owner_id", profileData.user_id);

      if (booksError) {
        throw new Error(`Failed to verify sample data: ${booksError.message}`);
      }

      console.log(`✅ Sample data verified: ${booksData.length} books created`);
    }

    console.log("\n🎉 Database seeding completed successfully!");
    console.log(`\n📋 Summary:`);
    console.log(`   Environment: ${env}`);
    console.log(`   Admin Email: ${currentConfig.admin.email}`);
    console.log(`   Admin User ID: ${profileData.user_id}`);

    if (env === "development") {
      console.log(`   Sample Data: Created`);
    }
  } catch (error) {
    console.error("❌ Error verifying setup:", error.message);
    throw error;
  }
}

/**
 * Main seeding function
 */
async function main() {
  try {
    console.log(`🚀 Starting database seeding for ${env} environment...\n`);

    // Create admin user
    const adminUser = await createAdminUser();

    // Update admin profile (the trigger will handle profile creation)
    await updateAdminProfile(adminUser.id);

    // Create sample data for development
    await createSampleData(adminUser.id);

    // Verify everything is set up correctly
    await verifySetup();
  } catch (error) {
    console.error("\n💥 Seeding failed:", error.message);
    process.exit(1);
  }
}

main();

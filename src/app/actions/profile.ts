"use server";

import { setBudgetNotification } from "@/lib/notificationHelpers";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(data: {
  displayName?: string;
  avatarUrl?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  console.log("user", user);

  try {
    // 1. Update Supabase Auth user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        display_name: data.displayName,
        avatar_url: data.avatarUrl,
      },
    });

    if (authError) throw authError;

    // 2. Update Prisma profile
    await prisma.profile.upsert({
      where: { user_id: user.id },
      update: {
        display_name: data.displayName,
        avatar_url: data.avatarUrl,
        updated_at: new Date(),
      },
      create: {
        user_id: user.id,
        email: user.email!,
        display_name: data.displayName,
        avatar_url: data.avatarUrl,
      },
    });

    revalidatePath("/profile");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function ensureProfileExistsAction(userData: {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
}) {
  try {
    const displayName =
      userData.display_name || userData.email?.split("@")[0] || "User";

    await prisma.profile.upsert({
      where: { user_id: userData.id },
      update: {
        email: userData.email,
        display_name: displayName,
        avatar_url: userData.avatar_url,
        updated_at: new Date(),
      },
      create: {
        user_id: userData.id,
        email: userData.email || "",
        display_name: displayName,
        avatar_url: userData.avatar_url,
      },
    });

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error in ensureProfileExistsAction:", error);
    return { success: false, error: error.message };
  }
}

export async function setMonthlyBudgetAction(
  bookId: string,
  month: string,
  amount: number
) {
  try {
    const budget = await prisma.monthlyBudget.upsert({
      where: {
        book_id_month: {
          book_id: bookId,
          month: month,
        },
      },
      update: {
        amount: amount,
        updated_at: new Date(),
      },
      create: {
        book_id: bookId,
        month: month,
        amount: amount,
      },
    });

    // Create notification
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: { name: true, owner_id: true },
    });

    if (book) {
      await setBudgetNotification(book.owner_id, {
        bookName: book.name,
        month: month,
        amount: amount,
      });
    }

    revalidatePath("/profile");
    revalidatePath(`/book/${bookId}`);
    return { budget, error: null };
  } catch (error: any) {
    return { budget: null, error: error.message };
  }
}

"use server";

import {
  assertOwnsBook,
  requireAdmin,
  requireUserId,
  stripOwnership,
} from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// `_userId` / `_isAdmin` params are kept for caller compatibility but
// ignored: the session decides who the user is (see src/lib/auth.ts).

export async function getUserSettings(_userId?: string) {
  try {
    const userId = await requireUserId();
    const settings = await prisma.userSettings.findUnique({
      where: { user_id: userId },
    });
    return { settings, error: null };
  } catch (error: any) {
    return { settings: null, error: error.message };
  }
}

export async function updateUserSettingsAction(_userId: string, data: any) {
  try {
    const userId = await requireUserId();
    const safeData = stripOwnership(data);
    if (safeData.default_book_id) {
      await assertOwnsBook(userId, safeData.default_book_id as string);
    }

    const settings = await prisma.userSettings.upsert({
      where: { user_id: userId },
      update: {
        ...safeData,
        updated_at: new Date(),
      },
      create: {
        ...safeData,
        user_id: userId,
      },
    });
    revalidatePath("/settings");
    return { settings, error: null };
  } catch (error: any) {
    return { settings: null, error: error.message };
  }
}

/** Role of the signed-in user */
export async function getProfileRole(_userId?: string) {
  try {
    const userId = await requireUserId();
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
      select: { role: true },
    });
    return { role: profile?.role || "user", error: null };
  } catch (error: any) {
    return { role: null, error: error.message };
  }
}

export async function clearDatabaseAction(_isAdmin?: boolean) {
  try {
    await requireAdmin();
    await prisma.$transaction([
      prisma.transaction.deleteMany({}),
      prisma.bookMember.deleteMany({}),
      prisma.monthlyBudget.deleteMany({}),
      prisma.book.deleteMany({}),
      prisma.userSettings.deleteMany({}),
      prisma.notification.deleteMany({}),
      prisma.profile.deleteMany({}),
    ]);
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

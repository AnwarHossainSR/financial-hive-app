"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUserSettings(userId: string) {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { user_id: userId },
    });
    return { settings, error: null };
  } catch (error: any) {
    return { settings: null, error: error.message };
  }
}

export async function updateUserSettingsAction(userId: string, data: any) {
  try {
    const settings = await prisma.userSettings.upsert({
      where: { user_id: userId },
      update: {
        ...data,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        ...data,
      },
    });
    revalidatePath("/settings");
    return { settings, error: null };
  } catch (error: any) {
    return { settings: null, error: error.message };
  }
}

export async function getProfileRole(userId: string) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
      select: { role: true },
    });
    return { role: profile?.role || "user", error: null };
  } catch (error: any) {
    return { role: null, error: error.message };
  }
}

export async function clearDatabaseAction(isAdmin: boolean) {
  if (!isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.$transaction([
      prisma.transaction.deleteMany({}),
      prisma.bookMember.deleteMany({}),
      prisma.monthlyBudget.deleteMany({}),
      prisma.book.deleteMany({}),
      prisma.userSettings.deleteMany({}),
      prisma.notification.deleteMany({}),
      prisma.profile.deleteMany({}),
    ]);
    revalidatePath("/");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

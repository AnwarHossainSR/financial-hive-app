"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getNotificationsAction(userId: string) {
  if (!userId) return { notifications: [], error: "User ID required" };

  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    return {
      notifications: notifications.map((n) => ({
        ...n,
        created_at: n.created_at.toISOString(),
        updated_at: n.updated_at.toISOString(),
      })),
      error: null,
    };
  } catch (error: any) {
    return { notifications: [], error: error.message };
  }
}

export async function getUnreadCountAction(userId: string) {
  if (!userId) return { count: 0, error: "User ID required" };

  try {
    const count = await prisma.notification.count({
      where: {
        user_id: userId,
        read: false,
      },
    });
    return { count, error: null };
  } catch (error: any) {
    return { count: 0, error: error.message };
  }
}

export async function markAsReadAction(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        updated_at: new Date(),
      },
    });
    revalidatePath("/");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markAllAsReadAction(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        user_id: userId,
        read: false,
      },
      data: {
        read: true,
        updated_at: new Date(),
      },
    });
    revalidatePath("/");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteNotificationAction(notificationId: string) {
  try {
    await prisma.notification.delete({
      where: { id: notificationId },
    });
    revalidatePath("/");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function clearAllNotificationsAction(userId: string) {
  try {
    await prisma.notification.deleteMany({
      where: { user_id: userId },
    });
    revalidatePath("/");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

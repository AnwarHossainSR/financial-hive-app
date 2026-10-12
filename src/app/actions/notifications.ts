"use server";

import { requireUserId } from "@/lib/auth";
import prisma from "@/lib/prisma";

// `_userId` params are kept for caller compatibility but ignored: the
// session decides who the user is (see src/lib/auth.ts).

export async function getNotificationsAction(_userId?: string) {
  try {
    const userId = await requireUserId();
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

export async function getUnreadCountAction(_userId?: string) {
  try {
    const userId = await requireUserId();
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
    const userId = await requireUserId();
    const { count } = await prisma.notification.updateMany({
      where: { id: notificationId, user_id: userId },
      data: {
        read: true,
        updated_at: new Date(),
      },
    });
    if (count === 0) throw new Error("Notification not found");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markAllAsReadAction(_userId?: string) {
  try {
    const userId = await requireUserId();
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
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteNotificationAction(notificationId: string) {
  try {
    const userId = await requireUserId();
    const { count } = await prisma.notification.deleteMany({
      where: { id: notificationId, user_id: userId },
    });
    if (count === 0) throw new Error("Notification not found");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function clearAllNotificationsAction(_userId?: string) {
  try {
    const userId = await requireUserId();
    await prisma.notification.deleteMany({
      where: { user_id: userId },
    });
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

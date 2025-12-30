"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUsersAction(params: {
  searchTerm?: string;
  roleFilter?: string;
  sortBy?: "created_at" | "email";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}) {
  const {
    searchTerm = "",
    roleFilter,
    sortBy = "created_at",
    sortOrder = "desc",
    page = 0,
    limit = 10,
  } = params;

  try {
    const where: any = {};
    if (searchTerm) {
      where.OR = [
        { email: { contains: searchTerm, mode: "insensitive" } },
        { display_name: { contains: searchTerm, mode: "insensitive" } },
      ];
    }
    if (roleFilter && roleFilter !== "all") {
      where.role = roleFilter;
    }

    const [profilesData, count] = await Promise.all([
      prisma.profile.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: page * limit,
        take: limit,
      }),
      prisma.profile.count({ where }),
    ]);

    return {
      users: profilesData.map((p) => ({
        ...p,
        created_at: p.created_at.toISOString(),
        updated_at: p.updated_at.toISOString(),
      })),
      total: count,
      error: null,
    };
  } catch (error: any) {
    return { users: [], total: 0, error: error.message };
  }
}

export async function updateUserRoleAction(userId: string, newRole: string) {
  try {
    await prisma.profile.update({
      where: { user_id: userId },
      data: {
        role: newRole,
        updated_at: new Date(),
      },
    });
    revalidatePath("/users");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { user_id: userId } }),
      prisma.bookMember.deleteMany({
        where: {
          OR: [{ user_id: userId }, { book: { owner_id: userId } }],
        },
      }),
      prisma.monthlyBudget.deleteMany({
        where: {
          book: { owner_id: userId },
        },
      }),
      prisma.book.deleteMany({ where: { owner_id: userId } }),
      prisma.userSettings.deleteMany({ where: { user_id: userId } }),
      prisma.notification.deleteMany({ where: { user_id: userId } }),
      prisma.profile.delete({ where: { user_id: userId } }),
    ]);
    revalidatePath("/users");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserStatsAction() {
  try {
    const profilesData = await prisma.profile.findMany({
      select: { role: true },
    });

    const roleStats = profilesData.reduce((acc, profile) => {
      const role = profile.role || "user";
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      stats: {
        total: profilesData.length,
        ...roleStats,
      },
      error: null,
    };
  } catch (error: any) {
    return { stats: null, error: error.message };
  }
}

"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createInvestmentPlatformAction(
  userId: string,
  data: any,
) {
  try {
    const platform = await prisma.investmentPlatform.create({
      data: {
        ...data,
        user_id: userId,
      },
    });

    revalidatePath("/investments");
    return { platform, error: null };
  } catch (error: any) {
    return { platform: null, error: error.message };
  }
}

export async function updateInvestmentPlatformAction(
  platformId: string,
  userId: string,
  data: any,
) {
  try {
    const platform = await prisma.investmentPlatform.update({
      where: { id: platformId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    revalidatePath("/investments");
    return { platform, error: null };
  } catch (error: any) {
    return { platform: null, error: error.message };
  }
}

export async function deleteInvestmentPlatformAction(
  platformId: string,
  userId: string,
) {
  try {
    const platform = await prisma.investmentPlatform.delete({
      where: { id: platformId },
    });

    revalidatePath("/investments");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvestmentPlatformsAction(userId: string) {
  try {
    const platforms = await prisma.investmentPlatform.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    return { platforms, error: null };
  } catch (error: any) {
    return { platforms: [], error: error.message };
  }
}

export async function getInvestmentPlatformAction(platformId: string) {
  try {
    const platform = await prisma.investmentPlatform.findUnique({
      where: { id: platformId },
      include: {
        projects: {
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!platform) return { platform: null, error: "Platform not found" };

    return { platform, error: null };
  } catch (error: any) {
    return { platform: null, error: error.message };
  }
}

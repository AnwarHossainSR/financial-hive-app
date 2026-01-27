"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Investment Platforms Actions (Isolated) ---

export async function createIsolatedInvestmentPlatformAction(
  userId: string,
  data: { name: string; description?: string },
) {
  console.log("🟢 createIsolatedInvestmentPlatformAction called with:", {
    userId,
    data,
  });
  try {
    const platform = await prisma.investmentPlatform.create({
      data: {
        name: data.name,
        description: data.description || null,
        user_id: userId,
      },
    });

    console.log("✅ Platform created successfully:", platform.id);
    revalidatePath("/investments");
    return {
      platform: {
        ...platform,
        description: platform.description || undefined,
      },
      error: null,
    };
  } catch (error: any) {
    console.error("❌ Platform creation error:", error.message);
    return { platform: null, error: error.message };
  }
}

export async function getIsolatedInvestmentPlatformsAction(userId: string) {
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

    return {
      platforms: platforms.map((p) => ({
        ...p,
        description: p.description || undefined,
        created_at: p.created_at.toISOString(),
        updated_at: p.updated_at.toISOString(),
      })),
      error: null,
    };
  } catch (error: any) {
    return { platforms: [], error: error.message };
  }
}

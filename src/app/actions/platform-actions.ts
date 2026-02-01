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
        projects: {
          select: {
            total_investment: true,
            total_profit_loss: true,
            remaining_capital: true,
            status: true,
          },
        },
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
        projects: p.projects.map((project) => ({
          total_investment: Number(project.total_investment),
          total_profit_loss: Number(project.total_profit_loss),
          remaining_capital: Number(project.remaining_capital),
          status: project.status,
        })),
      })),
      error: null,
    };
  } catch (error: any) {
    return { platforms: [], error: error.message };
  }
}

"use server";

import { requireUserId } from "@/lib/auth";
import { setBudgetNotification } from "@/lib/notificationHelpers";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// One overall monthly budget per user, across all books. Each row applies
// from its month until a later month sets a new amount (see useBudget).

/** All of the user's budget rows, oldest month first */
export async function getBudgetsAction() {
  try {
    const userId = await requireUserId();
    const rows = await prisma.userBudget.findMany({
      where: { user_id: userId },
      orderBy: { month: "asc" },
      select: { month: true, amount: true },
    });
    return {
      budgets: rows.map((row) => ({
        month: row.month,
        amount: Number(row.amount),
      })),
      error: null,
    };
  } catch (error: any) {
    return { budgets: null, error: error.message };
  }
}

/** Sets the budget from `month` ("YYYY-MM") onward; 0 means no budget */
export async function setBudgetAction(month: string, amount: number) {
  try {
    const userId = await requireUserId();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error("Invalid month");
    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error("Budget must be zero or more");
    }

    await prisma.userBudget.upsert({
      where: { user_id_month: { user_id: userId, month } },
      update: { amount, updated_at: new Date() },
      create: { user_id: userId, month, amount },
    });

    if (amount > 0) {
      await setBudgetNotification(userId, {
        bookName: "All books",
        month,
        amount,
      });
    }

    revalidatePath("/dashboard");
    return { budget: { month, amount }, error: null };
  } catch (error: any) {
    return { budget: null, error: error.message };
  }
}

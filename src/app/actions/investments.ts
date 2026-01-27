"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Investment Projects Actions ---

export async function createInvestmentProjectAction(userId: string, data: any) {
  try {
    const project = await prisma.investmentProject.create({
      data: {
        ...data,
        user_id: userId,
        total_profit_loss: 0,
        remaining_capital: 0,
        total_investment: 0,
      },
    });

    revalidatePath("/investments");
    return { project, error: null };
  } catch (error: any) {
    return { project: null, error: error.message };
  }
}

export async function updateInvestmentProjectAction(
  projectId: string,
  userId: string,
  data: any,
) {
  try {
    const project = await prisma.investmentProject.update({
      where: { id: projectId },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });

    revalidatePath("/investments");
    revalidatePath(`/investments/projects/${projectId}`);
    return { project, error: null };
  } catch (error: any) {
    return { project: null, error: error.message };
  }
}

export async function deleteInvestmentProjectAction(
  projectId: string,
  userId: string,
) {
  try {
    await prisma.investmentProject.delete({
      where: { id: projectId },
    });

    revalidatePath("/investments");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Investment Entries Actions ---

export async function createInvestmentEntryAction(
  projectId: string,
  userId: string,
  data: any,
) {
  try {
    const entry = await prisma.investmentEntry.create({
      data: {
        ...data,
        project_id: projectId,
        user_id: userId,
        amount: Number(data.amount),
        date: new Date(data.date),
      },
    });

    // Update project totals
    await updateProjectTotals(projectId);

    revalidatePath(`/investments/projects/${projectId}`);
    return { entry, error: null };
  } catch (error: any) {
    return { entry: null, error: error.message };
  }
}

export async function updateInvestmentEntryAction(
  entryId: string,
  userId: string,
  data: any,
) {
  try {
    const entry = await prisma.investmentEntry.update({
      where: { id: entryId },
      data: {
        ...data,
        amount: data.amount ? Number(data.amount) : undefined,
        profit_loss: data.profit_loss ? Number(data.profit_loss) : undefined,
        date: data.date ? new Date(data.date) : undefined,
        withdrawal_date: data.withdrawal_date
          ? new Date(data.withdrawal_date)
          : undefined,
        updated_at: new Date(),
      },
    });

    // Update project totals
    await updateProjectTotals(entry.project_id);

    revalidatePath(`/investments/projects/${entry.project_id}`);
    return { entry, error: null };
  } catch (error: any) {
    return { entry: null, error: error.message };
  }
}

export async function deleteInvestmentEntryAction(
  entryId: string,
  userId: string,
) {
  try {
    const entry = await prisma.investmentEntry.delete({
      where: { id: entryId },
    });

    // Update project totals
    await updateProjectTotals(entry.project_id);

    revalidatePath(`/investments/projects/${entry.project_id}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Bank Statements Actions ---

export async function createBankStatementAction(
  projectId: string,
  userId: string,
  data: any,
) {
  try {
    const statement = await prisma.bankStatement.create({
      data: {
        ...data,
        project_id: projectId,
        user_id: userId,
        total_capital: Number(data.total_capital),
        total_withdrawal: Number(data.total_withdrawal),
        balance: Number(data.total_capital) - Number(data.total_withdrawal),
        date: new Date(data.date),
      },
    });

    revalidatePath(`/investments/projects/${projectId}`);
    return { statement, error: null };
  } catch (error: any) {
    return { statement: null, error: error.message };
  }
}

export async function updateBankStatementAction(
  statementId: string,
  userId: string,
  data: any,
) {
  try {
    // Calculate balance if capital or withdrawal changed
    let balanceUpdate = {};
    if (data.total_capital || data.total_withdrawal) {
      // We need to fetch current values if not provided, but for simplicity
      // let's assume the UI sends both or we do a read-before-write.
      // Better: let's do a read first if needed, or rely on client sending partials correctly.
      // Actually, easiest is to just calculate balance in the update if both provided,
      // or re-fetch. Let's do a re-fetch to be safe if only one is provided.
      const current = await prisma.bankStatement.findUnique({
        where: { id: statementId },
      });
      if (current) {
        const capital =
          data.total_capital !== undefined
            ? Number(data.total_capital)
            : Number(current.total_capital);
        const withdrawal =
          data.total_withdrawal !== undefined
            ? Number(data.total_withdrawal)
            : Number(current.total_withdrawal);
        balanceUpdate = { balance: capital - withdrawal };
      }
    }

    const statement = await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        ...data,
        total_capital: data.total_capital
          ? Number(data.total_capital)
          : undefined,
        total_withdrawal: data.total_withdrawal
          ? Number(data.total_withdrawal)
          : undefined,
        date: data.date ? new Date(data.date) : undefined,
        ...balanceUpdate,
        updated_at: new Date(),
      },
    });

    revalidatePath(`/investments/projects/${statement.project_id}`);
    return { statement, error: null };
  } catch (error: any) {
    return { statement: null, error: error.message };
  }
}

export async function deleteBankStatementAction(
  statementId: string,
  userId: string,
) {
  try {
    const statement = await prisma.bankStatement.delete({
      where: { id: statementId },
    });

    revalidatePath(`/investments/projects/${statement.project_id}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Helper Functions ---

async function updateProjectTotals(projectId: string) {
  const entries = await prisma.investmentEntry.findMany({
    where: { project_id: projectId },
  });

  const totalInvestment = entries.reduce(
    (sum, entry) => sum + Number(entry.amount),
    0,
  );

  const totalProfitLoss = entries.reduce(
    (sum, entry) => sum + (entry.profit_loss ? Number(entry.profit_loss) : 0),
    0,
  );

  // Remaining capital logic depends on withdrawals.
  // Assuming remaining capital = total investment + profit - withdrawals
  // OR strictly based on active entries.
  // Let's assume remaining capital = sum of (amount + (profit_loss or 0)) for non-withdrawn entries?
  // Or simpler: Total Investment is sum of all deposits.
  // Remaining Capital is Total Investment + Total P/L - Withdrawals.

  // Let's look at the spreadsheet.
  // "Remaining Capital" seems to be the current value of the portfolio.
  // "Total Investment" is the initial input.
  // "Total Profit/Loss" is the gain/loss.

  // Let's implement basic calculation:
  // Total Investment = Sum of amounts (for all entries)
  // Total Profit/Loss = Sum of profit_loss (for all entries)
  // Remaining Capital = Total Investment + Total Profit/Loss (assuming no withdrawals tracked at project level yet,
  // or we need to subtract withdrawn amounts. The spreadsheet has "Total Withdraw" separately in Bank Statement).

  // Let's keep it simple: Remaining Capital = Total Investment + Total P/L (Net Value)
  const remainingCapital = totalInvestment + totalProfitLoss;

  await prisma.investmentProject.update({
    where: { id: projectId },
    data: {
      total_investment: totalInvestment,
      total_profit_loss: totalProfitLoss,
      remaining_capital: remainingCapital,
    },
  });
}

// --- Fetching Actions ---

export async function getInvestmentProjectsAction(userId: string) {
  try {
    const projects = await prisma.investmentProject.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    return {
      projects: projects.map((p) => ({
        ...p,
        description: p.description || undefined,
        total_profit_loss: Number(p.total_profit_loss),
        remaining_capital: Number(p.remaining_capital),
        total_investment: Number(p.total_investment),
      })),
      error: null,
    };
  } catch (error: any) {
    return { projects: [], error: error.message };
  }
}

export async function getInvestmentProjectAction(
  projectId: string,
  userId: string,
) {
  try {
    const project = await prisma.investmentProject.findUnique({
      where: { id: projectId },
      // In a real app, verify user_id matches or check permission (book ownership)
    });

    if (!project) return { project: null, error: "Project not found" };

    return {
      project: {
        ...project,
        total_profit_loss: Number(project.total_profit_loss),
        remaining_capital: Number(project.remaining_capital),
        total_investment: Number(project.total_investment),
      },
      error: null,
    };
  } catch (error: any) {
    return { project: null, error: error.message };
  }
}

export async function getInvestmentEntriesAction(
  projectId: string,
  pagination: { page: number; limit: number } = { page: 0, limit: 50 },
  filters?: { status?: string; platform?: string },
) {
  try {
    const where: any = { project_id: projectId };
    if (filters?.status) where.status = filters.status;
    if (filters?.platform)
      where.platform = { contains: filters.platform, mode: "insensitive" };

    const [entries, total] = await Promise.all([
      prisma.investmentEntry.findMany({
        where,
        orderBy: { date: "desc" },
        skip: pagination.page * pagination.limit,
        take: pagination.limit,
      }),
      prisma.investmentEntry.count({ where }),
    ]);

    return {
      entries: entries.map((e) => ({
        ...e,
        amount: Number(e.amount),
        profit_loss: e.profit_loss ? Number(e.profit_loss) : null,
      })),
      total,
      error: null,
    };
  } catch (error: any) {
    return { entries: [], total: 0, error: error.message };
  }
}

export async function getBankStatementsAction(projectId: string) {
  try {
    const statements = await prisma.bankStatement.findMany({
      where: { project_id: projectId },
      orderBy: { date: "desc" },
    });

    return {
      statements: statements.map((s) => ({
        ...s,
        total_capital: Number(s.total_capital),
        total_withdrawal: Number(s.total_withdrawal),
        balance: Number(s.balance),
      })),
      error: null,
    };
  } catch (error: any) {
    return { statements: [], error: error.message };
  }
}

export async function getInvestmentAnalyticsAction(projectId: string) {
  try {
    // We can add specific aggregation queries here if needed beyond what's on the project model
    // For now, the project model has the aggregated totals.
    // Let's return project details + some potentially expensive calcs if needed.
    const project = await prisma.investmentProject.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new Error("Project not found");

    return {
      analytics: {
        totalProfitLoss: Number(project.total_profit_loss),
        remainingCapital: Number(project.remaining_capital),
        totalInvestment: Number(project.total_investment),
        roi:
          Number(project.total_investment) > 0
            ? (Number(project.total_profit_loss) /
                Number(project.total_investment)) *
              100
            : 0,
      },
      error: null,
    };
  } catch (error: any) {
    return { analytics: null, error: error.message };
  }
}

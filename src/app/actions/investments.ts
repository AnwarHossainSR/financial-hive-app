"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Investment Platforms Actions ---

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

export async function getInvestmentPlatformAction(
  platformId: string,
  userId: string,
) {
  try {
    const platform = await prisma.investmentPlatform.findUnique({
      where: { id: platformId },
      include: {
        projects: {
          orderBy: { created_at: "desc" },
          include: {
            entries: {
              select: {
                id: true,
                maturity_date: true,
                order_date: true,
                duration_months: true,
                status: true,
              },
              orderBy: { order_date: "desc" },
            },
            _count: {
              select: { entries: true },
            },
          },
        },
        _count: {
          select: { projects: true },
        },
      },
    });

    if (!platform) return { platform: null, error: "Platform not found" };

    return {
      platform: {
        ...platform,
        description: platform.description || undefined,
        projects: platform.projects.map((p) => ({
          ...p,
          description: p.description || undefined,
          total_profit: Number(p.total_profit),
          total_loss: Number(p.total_loss),
          total_profit_loss: Number(p.total_profit_loss),
          remaining_capital: Number(p.remaining_capital),
          total_investment: Number(p.total_investment),
          investment_entries: p.entries,
        })),
      },
      error: null,
    };
  } catch (error: any) {
    return { platform: null, error: error.message };
  }
}

export async function createNewInvestmentPlatformAction(
  userId: string,
  data: { name: string; description?: string },
) {
  try {
    const platform = await prisma.investmentPlatform.create({
      data: {
        name: data.name,
        description: data.description || null,
        user_id: userId,
      },
    });

    revalidatePath("/");
    return {
      platform: {
        ...platform,
        description: platform.description || undefined,
      },
      error: null,
    };
  } catch (error: any) {
    return { platform: null, error: error.message };
  }
}

export async function updateInvestmentPlatformAction(
  platformId: string,
  userId: string,
  data: { name?: string; description?: string },
) {
  try {
    const platform = await prisma.investmentPlatform.update({
      where: { id: platformId },
      data: {
        name: data.name,
        description: data.description,
        updated_at: new Date(),
      },
    });

    revalidatePath("/");
    revalidatePath(`/investments/platforms/${platformId}`);
    return {
      platform: {
        ...platform,
        description: platform.description || undefined,
      },
      error: null,
    };
  } catch (error: any) {
    return { platform: null, error: error.message };
  }
}

export async function deleteInvestmentPlatformAction(
  platformId: string,
  userId: string,
) {
  try {
    await prisma.investmentPlatform.delete({
      where: { id: platformId },
    });

    revalidatePath("/");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Investment Projects Actions ---

export async function createNewInvestmentProjectAction(
  userId: string,
  data: any,
) {
  try {
    if (!data.platform_id) {
      return {
        project: null,
        error: "Platform is required. Please select a platform for this project.",
      };
    }

    const project = await prisma.investmentProject.create({
      data: {
        ...data,
        user_id: userId,
        platform_id: data.platform_id,
        // Initial values - will be calculated by triggers
        total_profit: 0,
        total_loss: 0,
        total_profit_loss: 0,
        remaining_capital: 0,
        total_investment: 0,
      },
    });

    revalidatePath("/");
    revalidatePath(`/investments/platforms/${data.platform_id}`);
    return {
      project: {
        ...project,
        total_profit: Number(project.total_profit),
        total_loss: Number(project.total_loss),
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
        platform_id: data.platform_id,
        updated_at: new Date(),
      },
    });

    revalidatePath("/");
    revalidatePath(`/investments/projects/${projectId}`);
    return {
      project: {
        ...project,
        total_profit: Number(project.total_profit),
        total_loss: Number(project.total_loss),
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

export async function deleteInvestmentProjectAction(
  projectId: string,
  userId: string,
) {
  try {
    await prisma.investmentProject.delete({
      where: { id: projectId },
    });

    revalidatePath("/");
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
        project_id: projectId,
        user_id: userId,
        order_no: data.order_no ? Number(data.order_no) : null,
        order_date: new Date(data.order_date),
        order_id: data.order_id || null,
        investment_type: data.investment_type || 'Investment',
        status: data.status || 'active',
        investment_amount: Number(data.investment_amount),
        duration_months: data.duration_months ? Number(data.duration_months) : null,
        roi_min: data.roi_min ? Number(data.roi_min) : null,
        roi_max: data.roi_max ? Number(data.roi_max) : null,
        return_amount: data.return_amount ? Number(data.return_amount) : null,
        actual_profit: data.actual_profit ? Number(data.actual_profit) : null,
        capital_added: data.capital_added ? Number(data.capital_added) : null,
        withdrawal_amount: data.withdrawal_amount ? Number(data.withdrawal_amount) : null,
        is_completed: data.is_completed || false,
        notes: data.notes || null,
        image_url: data.image_url || null,
      },
    });

    revalidatePath(`/investments/projects/${projectId}`);
    return {
      entry: {
        ...entry,
        investment_amount: Number(entry.investment_amount),
        roi_min: entry.roi_min ? Number(entry.roi_min) : null,
        roi_max: entry.roi_max ? Number(entry.roi_max) : null,
        expected_return: entry.expected_return ? Number(entry.expected_return) : null,
        expected_profit: entry.expected_profit ? Number(entry.expected_profit) : null,
        return_amount: entry.return_amount ? Number(entry.return_amount) : null,
        actual_profit: entry.actual_profit ? Number(entry.actual_profit) : null,
        capital_added: entry.capital_added ? Number(entry.capital_added) : null,
        withdrawal_amount: entry.withdrawal_amount ? Number(entry.withdrawal_amount) : null,
      },
      error: null,
    };
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
        order_no: data.order_no ? Number(data.order_no) : undefined,
        order_date: data.order_date ? new Date(data.order_date) : undefined,
        order_id: data.order_id,
        investment_type: data.investment_type,
        status: data.status,
        investment_amount: data.investment_amount ? Number(data.investment_amount) : undefined,
        duration_months: data.duration_months ? Number(data.duration_months) : undefined,
        roi_min: data.roi_min ? Number(data.roi_min) : undefined,
        roi_max: data.roi_max ? Number(data.roi_max) : undefined,
        return_amount: data.return_amount ? Number(data.return_amount) : undefined,
        actual_profit: data.actual_profit ? Number(data.actual_profit) : undefined,
        capital_added: data.capital_added ? Number(data.capital_added) : undefined,
        withdrawal_amount: data.withdrawal_amount ? Number(data.withdrawal_amount) : undefined,
        is_completed: data.is_completed,
        notes: data.notes,
        image_url: data.image_url,
        updated_at: new Date(),
      },
    });

    revalidatePath(`/investments/projects/${entry.project_id}`);
    return {
      entry: {
        ...entry,
        investment_amount: Number(entry.investment_amount),
        roi_min: entry.roi_min ? Number(entry.roi_min) : null,
        roi_max: entry.roi_max ? Number(entry.roi_max) : null,
        expected_return: entry.expected_return ? Number(entry.expected_return) : null,
        expected_profit: entry.expected_profit ? Number(entry.expected_profit) : null,
        return_amount: entry.return_amount ? Number(entry.return_amount) : null,
        actual_profit: entry.actual_profit ? Number(entry.actual_profit) : null,
        capital_added: entry.capital_added ? Number(entry.capital_added) : null,
        withdrawal_amount: entry.withdrawal_amount ? Number(entry.withdrawal_amount) : null,
      },
      error: null,
    };
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

    // Trigger will automatically calculate project totals
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
    return {
      statement: {
        ...statement,
        total_capital: Number(statement.total_capital),
        total_withdrawal: Number(statement.total_withdrawal),
        balance: Number(statement.balance),
      },
      error: null,
    };
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
    const current = await prisma.bankStatement.findUnique({
      where: { id: statementId },
    });
    
    if (!current) {
      return { statement: null, error: "Statement not found" };
    }

    const capital = data.total_capital !== undefined ? Number(data.total_capital) : Number(current.total_capital);
    const withdrawal = data.total_withdrawal !== undefined ? Number(data.total_withdrawal) : Number(current.total_withdrawal);
    const balance = capital - withdrawal;

    const statement = await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        ...data,
        total_capital: data.total_capital ? Number(data.total_capital) : undefined,
        total_withdrawal: data.total_withdrawal ? Number(data.total_withdrawal) : undefined,
        balance: balance,
        date: data.date ? new Date(data.date) : undefined,
        updated_at: new Date(),
      },
    });

    revalidatePath(`/investments/projects/${statement.project_id}`);
    return {
      statement: {
        ...statement,
        total_capital: Number(statement.total_capital),
        total_withdrawal: Number(statement.total_withdrawal),
        balance: Number(statement.balance),
      },
      error: null,
    };
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

// Simplified helper - calculations now handled by database triggers
async function updateProjectTotals(projectId: string) {
  // The database trigger will automatically calculate totals
  // We just need to trigger a recalculation by calling the function
  try {
    await prisma.$executeRaw`SELECT calculate_project_totals(${projectId}::uuid)`;
  } catch (error) {
    console.error('Error updating project totals:', error);
  }
}

// --- Fetching Actions ---

export async function getInvestmentProjectsAction(
  userId: string,
  platformId?: string,
) {
  try {
    const where: any = { user_id: userId };
    if (platformId) {
      where.platform_id = platformId;
    }

    const projects = await prisma.investmentProject.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        platform: true,
        _count: {
          select: { entries: true },
        },
      },
    });

    return {
      projects: projects.map((p) => ({
        ...p,
        description: p.description || undefined,
        total_profit: Number(p.total_profit),
        total_loss: Number(p.total_loss),
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
      include: { platform: true },
    });

    if (!project) return { project: null, error: "Project not found" };

    return {
      project: {
        ...project,
        total_profit: Number(project.total_profit),
        total_loss: Number(project.total_loss),
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
  filters?: { status?: string },
) {
  try {
    const where: any = { project_id: projectId };
    if (filters?.status) where.status = filters.status;

    const [entries, total] = await Promise.all([
      prisma.investmentEntry.findMany({
        where,
        orderBy: { order_date: "desc" },
        skip: pagination.page * pagination.limit,
        take: pagination.limit,
      }),
      prisma.investmentEntry.count({ where }),
    ]);

    return {
      entries: entries.map((e) => ({
        ...e,
        investment_amount: Number(e.investment_amount),
        roi_min: e.roi_min ? Number(e.roi_min) : null,
        roi_max: e.roi_max ? Number(e.roi_max) : null,
        expected_return: e.expected_return ? Number(e.expected_return) : null,
        expected_profit: e.expected_profit ? Number(e.expected_profit) : null,
        return_amount: e.return_amount ? Number(e.return_amount) : null,
        actual_profit: e.actual_profit ? Number(e.actual_profit) : null,
        capital_added: e.capital_added ? Number(e.capital_added) : null,
        withdrawal_amount: e.withdrawal_amount ? Number(e.withdrawal_amount) : null,
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
    const project = await prisma.investmentProject.findUnique({
      where: { id: projectId },
    });

    if (!project) throw new Error("Project not found");

    return {
      analytics: {
        totalProfitLoss: Number(project.total_profit_loss),
        remainingCapital: Number(project.remaining_capital),
        totalInvestment: Number(project.total_investment),
        totalProfit: Number(project.total_profit),
        totalLoss: Number(project.total_loss),
        roi: Number(project.total_investment) > 0
          ? (Number(project.total_profit_loss) / Number(project.total_investment)) * 100
          : 0,
      },
      error: null,
    };
  } catch (error: any) {
    return { analytics: null, error: error.message };
  }
}

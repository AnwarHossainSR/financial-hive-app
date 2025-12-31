"use server";

import {
  createTransactionNotification,
  deleteTransactionNotification,
  importTransactionsNotification,
  updateTransactionNotification,
} from "@/lib/notificationHelpers";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTransactionsAction(params: {
  userId: string;
  bookId?: string;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { userId, page = 0, limit = 50, ...filters } = params;
  if (!userId) return { transactions: [], total: 0, error: "User ID required" };

  try {
    const where: any = { user_id: userId };

    if (filters.bookId) where.book_id = filters.bookId;
    if (filters.type) where.type = filters.type as any;
    if (filters.category) where.category = filters.category;
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      if (filters.startDate.length <= 10) start.setHours(0, 0, 0, 0);
      where.date = { ...where.date, gte: start };
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      if (filters.endDate.length <= 10) end.setHours(23, 59, 59, 999);
      where.date = { ...where.date, lte: end };
    }
    if (filters.search) {
      where.note = { contains: filters.search, mode: "insensitive" };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: [{ date: "desc" }, { created_at: "desc" }],
        skip: page * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
        note: t.note || undefined,
        image_url: t.image_url || undefined,
        date: t.date.toISOString(),
        created_at: t.created_at.toISOString(),
        updated_at: t.updated_at.toISOString(),
      })),
      total,
      error: null,
    };
  } catch (error: any) {
    return { transactions: [], total: 0, error: error.message };
  }
}

export async function createTransactionAction(userId: string, data: any) {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        user_id: userId,
        amount: Number(data.amount),
        date: new Date(data.date),
      },
    });

    await createTransactionNotification(userId, {
      id: transaction.id,
      type: transaction.type as any,
      amount: Number(transaction.amount),
      category: transaction.category,
      note: transaction.note || undefined,
    });

    revalidatePath("/");
    revalidatePath(`/book/${data.book_id}`);
    return { transaction, error: null };
  } catch (error: any) {
    return { transaction: null, error: error.message };
  }
}

export async function updateTransactionAction(
  transactionId: string,
  userId: string,
  updates: any
) {
  try {
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...updates,
        amount:
          updates.amount !== undefined ? Number(updates.amount) : undefined,
        date: updates.date !== undefined ? new Date(updates.date) : undefined,
        updated_at: new Date(),
      },
    });

    await updateTransactionNotification(userId, {
      id: transaction.id,
      type: transaction.type as any,
      amount: Number(transaction.amount),
      category: transaction.category,
    });

    revalidatePath("/");
    revalidatePath(`/book/${transaction.book_id}`);
    return { transaction, error: null };
  } catch (error: any) {
    return { transaction: null, error: error.message };
  }
}

export async function deleteTransactionAction(
  transactionId: string,
  userId: string
) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) throw new Error("Transaction not found");

    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    await deleteTransactionNotification(userId, {
      id: transactionId,
      type: transaction.type as any,
      amount: Number(transaction.amount),
    });

    revalidatePath("/");
    revalidatePath(`/book/${transaction.book_id}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function importTransactionsAction(
  userId: string,
  transactions: any[]
) {
  try {
    const data = transactions.map((t) => ({
      ...t,
      user_id: userId,
      amount: Number(t.amount),
      date: t.date ? new Date(t.date) : new Date(),
    }));

    const result = await prisma.transaction.createMany({
      data,
    });

    await importTransactionsNotification(userId, result.count);

    revalidatePath("/");
    return { count: result.count, error: null };
  } catch (error: any) {
    return { count: 0, error: error.message };
  }
}

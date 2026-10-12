"use server";

import { assertOwnsBook, requireUserId, stripOwnership } from "@/lib/auth";
import {
  createTransactionNotification,
  deleteTransactionNotification,
  importTransactionsNotification,
  updateTransactionNotification,
} from "@/lib/notificationHelpers";
import prisma from "@/lib/prisma";
import { CATEGORY_SEPARATOR } from "@/lib/utils";
import { revalidatePath } from "next/cache";

// `userId` / `_userId` inputs are kept for caller compatibility but ignored:
// the session decides who the user is (see src/lib/auth.ts).

interface TransactionQueryFilters {
  userId?: string;
  bookId?: string;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  note?: string;
}

function buildTransactionWhere(
  filters: TransactionQueryFilters,
  userId: string,
) {
  const where: any = { user_id: userId };

  if (filters.bookId) where.book_id = filters.bookId;
  if (filters.type) where.type = filters.type as any;
  if (filters.category) {
    // Categories are stored comma-separated ("Food & Dining, Wife"), so match
    // the category as a whole token anywhere in the list. Legacy rows with a
    // single category still match via the exact-equality branch.
    const cat = filters.category;
    where.OR = [
      { category: cat },
      { category: { startsWith: `${cat}${CATEGORY_SEPARATOR}` } },
      { category: { endsWith: `${CATEGORY_SEPARATOR}${cat}` } },
      {
        category: {
          contains: `${CATEGORY_SEPARATOR}${cat}${CATEGORY_SEPARATOR}`,
        },
      },
    ];
  }
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
  const noteTerms = [filters.search, filters.note].filter(Boolean);
  if (noteTerms.length > 0) {
    where.AND = noteTerms.map((term) => ({
      note: { contains: term, mode: "insensitive" },
    }));
  }
  return where;
}

async function sumByType(where: any) {
  const sums = await prisma.transaction.groupBy({
    by: ["type"],
    where,
    _sum: { amount: true },
  });
  const sumFor = (type: string) =>
    Number(sums.find((s) => s.type === type)?._sum.amount ?? 0);
  return { income: sumFor("income"), expense: sumFor("expense") };
}

/** Income/expense totals for a filter set, e.g. the previous month for trends */
export async function getTransactionTotalsAction(
  filters: TransactionQueryFilters,
) {
  try {
    const userId = await requireUserId();
    return {
      totals: await sumByType(buildTransactionWhere(filters, userId)),
      error: null,
    };
  } catch (error: any) {
    return { totals: null, error: error.message };
  }
}

export async function getTransactionsAction(
  params: TransactionQueryFilters & { page?: number; limit?: number },
) {
  const { page = 0, limit = 50, ...filters } = params;

  try {
    const userId = await requireUserId();
    const where = buildTransactionWhere(filters, userId);

    const [transactions, total, totals] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: [{ date: "desc" }, { created_at: "desc" }],
        skip: page * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
      // Totals across every matching row, not just the loaded page; only
      // needed once per query so later pages skip it.
      page === 0 ? sumByType(where) : Promise.resolve(null),
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
      totals,
      error: null,
    };
  } catch (error: any) {
    return { transactions: [], total: 0, totals: null, error: error.message };
  }
}

export async function createTransactionAction(_userId: string, data: any) {
  try {
    const userId = await requireUserId();
    await assertOwnsBook(userId, data.book_id);
    const transaction = await prisma.transaction.create({
      data: {
        ...stripOwnership(data),
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

    revalidatePath(`/book/${data.book_id}`);
    return { transaction, error: null };
  } catch (error: any) {
    return { transaction: null, error: error.message };
  }
}

export async function updateTransactionAction(
  transactionId: string,
  _userId: string,
  updates: any
) {
  try {
    const userId = await requireUserId();
    const existing = await prisma.transaction.findFirst({
      where: { id: transactionId, user_id: userId },
      select: { book_id: true },
    });
    if (!existing) throw new Error("Transaction not found");
    // Moving a transaction is only allowed into another book the user owns
    if (updates.book_id && updates.book_id !== existing.book_id) {
      await assertOwnsBook(userId, updates.book_id);
    }

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...stripOwnership(updates),
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

    revalidatePath(`/book/${transaction.book_id}`);
    return { transaction, error: null };
  } catch (error: any) {
    return { transaction: null, error: error.message };
  }
}

export async function deleteTransactionAction(
  transactionId: string,
  _userId: string
) {
  try {
    const userId = await requireUserId();
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, user_id: userId },
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

    revalidatePath(`/book/${transaction.book_id}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function importTransactionsAction(
  _userId: string,
  transactions: any[]
) {
  try {
    const userId = await requireUserId();
    // Every target book must belong to the importer
    const bookIds = [...new Set(transactions.map((t) => t.book_id))];
    const owned = await prisma.book.count({
      where: { id: { in: bookIds }, owner_id: userId },
    });
    if (owned !== bookIds.length) throw new Error("Book not found");

    const data = transactions.map((t) => ({
      ...stripOwnership(t),
      user_id: userId,
      amount: Number(t.amount),
      date: t.date ? new Date(t.date) : new Date(),
    }));

    const result = await prisma.transaction.createMany({
      data,
    });

    await importTransactionsNotification(userId, result.count);

    revalidatePath("/dashboard");
    return { count: result.count, error: null };
  } catch (error: any) {
    return { count: 0, error: error.message };
  }
}

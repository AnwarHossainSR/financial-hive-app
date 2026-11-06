"use server";

import { assertOwnsBook, requireUserId, stripOwnership } from "@/lib/auth";
import {
  createTransactionNotification,
  deleteTransactionNotification,
  importTransactionsNotification,
  updateTransactionNotification,
} from "@/lib/notificationHelpers";
import prisma from "@/lib/prisma";
import { CATEGORY_SEPARATOR, parseCategories } from "@/lib/utils";
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
  const and: any[] = [];

  // A book shows its own transactions plus those shared into it. Without a
  // bookId (all books, or the default book) every transaction counts once.
  if (filters.bookId) {
    and.push({
      OR: [
        { book_id: filters.bookId },
        { shared_books: { some: { book_id: filters.bookId } } },
      ],
    });
  }
  if (filters.type) where.type = filters.type as any;
  if (filters.category) {
    // Categories are stored comma-separated ("Food & Dining, Wife"), so match
    // the category as a whole token anywhere in the list. Legacy rows with a
    // single category still match via the exact-equality branch.
    const cat = filters.category;
    and.push({
      OR: [
        { category: cat },
        { category: { startsWith: `${cat}${CATEGORY_SEPARATOR}` } },
        { category: { endsWith: `${CATEGORY_SEPARATOR}${cat}` } },
        {
          category: {
            contains: `${CATEGORY_SEPARATOR}${cat}${CATEGORY_SEPARATOR}`,
          },
        },
      ],
    });
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
  for (const term of [filters.search, filters.note]) {
    if (term) and.push({ note: { contains: term, mode: "insensitive" } });
  }
  if (and.length > 0) where.AND = and;
  return where;
}

/**
 * What a book page shows. The default book is the overview of every book, so
 * its id means "no book filter"; any other book shows its own transactions
 * plus those shared into it. Deciding here means the page doesn't have to
 * load the books list before it can ask for transactions.
 */
async function resolveBookScope(
  filters: TransactionQueryFilters,
  userId: string,
): Promise<TransactionQueryFilters> {
  if (!filters.bookId) return filters;
  const book = await prisma.book.findFirst({
    where: { id: filters.bookId, owner_id: userId },
    select: { is_default: true },
  });
  return book?.is_default ? { ...filters, bookId: undefined } : filters;
}

/**
 * The other books a transaction should also appear in: distinct, without its
 * own book, and all owned by the user.
 */
async function resolveSharedBookIds(
  userId: string,
  homeBookId: string,
  ids: unknown,
): Promise<string[]> {
  if (!Array.isArray(ids)) return [];
  const unique = [
    ...new Set(
      ids.filter(
        (id): id is string => typeof id === "string" && id !== homeBookId,
      ),
    ),
  ];
  if (unique.length === 0) return [];
  const owned = await prisma.book.count({
    where: { id: { in: unique }, owner_id: userId },
  });
  if (owned !== unique.length) throw new Error("Book not found");
  return unique;
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
    const scoped = await resolveBookScope(filters, userId);
    return {
      totals: await sumByType(buildTransactionWhere(scoped, userId)),
      error: null,
    };
  } catch (error: any) {
    return { totals: null, error: error.message };
  }
}

/**
 * Totals for several date ranges in one round trip, e.g. the last six months
 * for a cash-flow chart. Ranges come from the client so month boundaries use
 * the viewer's timezone, like the rest of the month filters.
 */
export async function getPeriodTotalsAction(
  filters: TransactionQueryFilters,
  ranges: { startDate: string; endDate: string }[],
) {
  try {
    const userId = await requireUserId();
    const scoped = await resolveBookScope(filters, userId);
    const totals = await Promise.all(
      ranges
        .slice(0, 24)
        .map((range) =>
          sumByType(buildTransactionWhere({ ...scoped, ...range }, userId)),
        ),
    );
    return { totals, error: null };
  } catch (error: any) {
    return { totals: null, error: error.message };
  }
}

/**
 * Amount per category and type. A multi-category transaction counts toward
 * its first category only (the one its icon shows), so the parts add up to
 * the period total instead of double counting.
 */
export async function getCategoryTotalsAction(
  filters: TransactionQueryFilters,
) {
  try {
    const userId = await requireUserId();
    const scoped = await resolveBookScope(filters, userId);
    const groups = await prisma.transaction.groupBy({
      by: ["category", "type"],
      where: buildTransactionWhere(scoped, userId),
      _sum: { amount: true },
      _count: { _all: true },
    });

    const merged = new Map<
      string,
      {
        category: string;
        type: "income" | "expense";
        amount: number;
        count: number;
      }
    >();
    for (const group of groups) {
      const category = parseCategories(group.category)[0] || "Other";
      const type = group.type as "income" | "expense";
      const key = `${type}:${category}`;
      const entry = merged.get(key) ?? { category, type, amount: 0, count: 0 };
      entry.amount += Number(group._sum.amount ?? 0);
      entry.count += group._count._all;
      merged.set(key, entry);
    }

    return {
      categories: [...merged.values()].sort((a, b) => b.amount - a.amount),
      error: null,
    };
  } catch (error: any) {
    return { categories: null, error: error.message };
  }
}

export async function getTransactionsAction(
  params: TransactionQueryFilters & { page?: number; limit?: number },
) {
  const { page = 0, limit = 50, ...filters } = params;

  try {
    const userId = await requireUserId();
    const where = buildTransactionWhere(
      await resolveBookScope(filters, userId),
      userId,
    );

    const [transactions, total, totals] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: [{ date: "desc" }, { created_at: "desc" }],
        skip: page * limit,
        take: limit,
        include: { shared_books: { select: { book_id: true } } },
      }),
      prisma.transaction.count({ where }),
      // Totals across every matching row, not just the loaded page; only
      // needed once per query so later pages skip it.
      page === 0 ? sumByType(where) : Promise.resolve(null),
    ]);

    return {
      transactions: transactions.map(({ shared_books, ...t }) => ({
        ...t,
        shared_book_ids: shared_books.map((share) => share.book_id),
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
    const { shared_book_ids, ...fields } = stripOwnership(data);
    const sharedBookIds = await resolveSharedBookIds(
      userId,
      data.book_id,
      shared_book_ids,
    );
    const transaction = await prisma.transaction.create({
      data: {
        ...fields,
        user_id: userId,
        amount: Number(data.amount),
        date: new Date(data.date),
        shared_books: {
          create: sharedBookIds.map((book_id) => ({ book_id })),
        },
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

    const { shared_book_ids, ...fields } = stripOwnership(updates);
    // Only replace the shared books when the caller sent a list
    const sharedBookIds =
      shared_book_ids === undefined
        ? undefined
        : await resolveSharedBookIds(
            userId,
            updates.book_id ?? existing.book_id,
            shared_book_ids,
          );

    const transaction = await prisma.$transaction(async (tx) => {
      if (sharedBookIds) {
        await tx.transactionBook.deleteMany({
          where: { transaction_id: transactionId },
        });
        await tx.transactionBook.createMany({
          data: sharedBookIds.map((book_id) => ({
            transaction_id: transactionId,
            book_id,
          })),
        });
      }
      return tx.transaction.update({
        where: { id: transactionId },
        data: {
          ...fields,
          amount:
            updates.amount !== undefined ? Number(updates.amount) : undefined,
          date:
            updates.date !== undefined ? new Date(updates.date) : undefined,
          updated_at: new Date(),
        },
      });
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

    // Imports don't share into other books
    const data = transactions.map(({ shared_book_ids: _shared, ...t }) => ({
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

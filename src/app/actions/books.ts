"use server";

import { assertOwnsBook, requireUserId, stripOwnership } from "@/lib/auth";
import {
  createBookNotification,
  updateBookNotification,
  welcomeNotification,
} from "@/lib/notificationHelpers";
import { cached, invalidate } from "@/lib/cache";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// `_userId` params are kept for caller compatibility but ignored: the
// session decides who the user is (see src/lib/auth.ts).

export async function getBooksAction(_userId?: string) {
  try {
    const userId = await requireUserId();
    const books = await cached("books", userId, null, async () => {
      const rows = await prisma.book.findMany({
        where: { owner_id: userId },
        include: {
          monthly_budgets: true,
        },
        orderBy: [{ is_default: "desc" }, { created_at: "desc" }],
      });
      return rows.map((b) => ({
        ...b,
        created_at: b.created_at.toISOString(),
        updated_at: b.updated_at.toISOString(),
        monthly_budgets: b.monthly_budgets.map((mb) => ({
          ...mb,
          amount: Number(mb.amount),
          created_at: mb.created_at.toISOString(),
          updated_at: mb.updated_at.toISOString(),
        })),
      }));
    });

    return { books, error: null };
  } catch (error: any) {
    return { books: [], error: error.message };
  }
}

export async function createBookAction(
  _userId: string,
  data: {
    name: string;
    type: "personal" | "business";
    description?: string;
    is_default?: boolean;
  }
) {
  try {
    const userId = await requireUserId();
    const book = await prisma.$transaction(async (tx) => {
      if (data.is_default) {
        await tx.book.updateMany({
          where: { owner_id: userId },
          data: { is_default: false },
        });
      }

      return await tx.book.create({
        data: {
          name: data.name,
          description: data.description,
          is_default: data.is_default,
          owner_id: userId,
          type: data.type as any,
        },
        include: {
          monthly_budgets: true,
        },
      });
    });

    await invalidate("books", userId);

    // Notifications
    await createBookNotification(userId, {
      id: book.id,
      name: book.name,
      type: book.type as any,
    });

    const bookCount = await prisma.book.count({ where: { owner_id: userId } });
    if (bookCount === 1) {
      await welcomeNotification(userId, ""); // Can pass display name if needed
    }

    revalidatePath("/dashboard");
    revalidatePath("/profile");
    return { book, error: null };
  } catch (error: any) {
    return { book: null, error: error.message };
  }
}

export async function updateBookAction(
  bookId: string,
  _userId: string,
  updates: any
) {
  try {
    const userId = await requireUserId();
    await assertOwnsBook(userId, bookId);

    const book = await prisma.$transaction(async (tx) => {
      if (updates.is_default) {
        await tx.book.updateMany({
          where: {
            owner_id: userId,
            id: { not: bookId },
          },
          data: { is_default: false },
        });
      }

      return await tx.book.update({
        where: { id: bookId },
        data: {
          ...stripOwnership(updates),
          updated_at: new Date(),
        },
        include: {
          monthly_budgets: true,
        },
      });
    });

    await invalidate("books", userId);

    await updateBookNotification(userId, {
      id: book.id,
      name: book.name,
    });

    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath(`/book/${bookId}`);
    return { book, error: null };
  } catch (error: any) {
    return { book: null, error: error.message };
  }
}

export async function deleteBookAction(bookId: string) {
  try {
    const userId = await requireUserId();
    const { count } = await prisma.book.deleteMany({
      where: { id: bookId, owner_id: userId },
    });
    if (count === 0) throw new Error("Book not found");

    await invalidate("books", userId);
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

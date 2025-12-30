"use server";

import {
  createBookNotification,
  updateBookNotification,
  welcomeNotification,
} from "@/lib/notificationHelpers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getBooksAction(userId: string) {
  if (!userId) return { books: [], error: "User ID required" };

  try {
    const books = await prisma.book.findMany({
      where: { owner_id: userId },
      include: {
        monthly_budgets: true,
      },
      orderBy: [{ is_default: "desc" }, { created_at: "desc" }],
    });

    return {
      books: books.map((b) => ({
        ...b,
        created_at: b.created_at.toISOString(),
        updated_at: b.updated_at.toISOString(),
        monthly_budgets: b.monthly_budgets.map((mb) => ({
          ...mb,
          created_at: mb.created_at.toISOString(),
          updated_at: mb.updated_at.toISOString(),
        })),
      })),
      error: null,
    };
  } catch (error: any) {
    return { books: [], error: error.message };
  }
}

export async function createBookAction(
  userId: string,
  data: {
    name: string;
    type: "personal" | "business";
    description?: string;
    is_default?: boolean;
  }
) {
  try {
    const book = await prisma.$transaction(async (tx) => {
      if (data.is_default) {
        await tx.book.updateMany({
          where: { owner_id: userId },
          data: { is_default: false },
        });
      }

      return await tx.book.create({
        data: {
          ...data,
          owner_id: userId,
          type: data.type as any,
        },
        include: {
          monthly_budgets: true,
        },
      });
    });

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

    revalidatePath("/");
    revalidatePath("/profile");
    return { book, error: null };
  } catch (error: any) {
    return { book: null, error: error.message };
  }
}

export async function updateBookAction(
  bookId: string,
  userId: string,
  updates: any
) {
  try {
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
          ...updates,
          updated_at: new Date(),
        },
        include: {
          monthly_budgets: true,
        },
      });
    });

    await updateBookNotification(userId, {
      id: book.id,
      name: book.name,
    });

    revalidatePath("/");
    revalidatePath("/profile");
    revalidatePath(`/book/${bookId}`);
    return { book, error: null };
  } catch (error: any) {
    return { book: null, error: error.message };
  }
}

export async function deleteBookAction(bookId: string) {
  try {
    await prisma.book.delete({
      where: { id: bookId },
    });
    revalidatePath("/");
    revalidatePath("/profile");
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

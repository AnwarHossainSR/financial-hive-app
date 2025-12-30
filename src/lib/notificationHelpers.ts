// Helper functions to create notifications for different events
// Import these into your transaction and book hooks

import { prisma } from "@/lib/prisma";

export type NotificationType = "info" | "success" | "warning" | "error";

interface NotificationData {
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, any>;
}

// Helper function to create a notification
const createNotificationInDB = async (
  userId: string,
  notificationData: NotificationData
) => {
  try {
    await prisma.notification.create({
      data: {
        user_id: userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type as any,
        metadata: notificationData.metadata || {},
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};

// Transaction-related notification helpers
export const createTransactionNotification = async (
  userId: string,
  transaction: {
    id: string;
    type: "income" | "expense";
    amount: number;
    category: string;
    note?: string;
  }
) => {
  const isIncome = transaction.type === "income";
  const title = `${isIncome ? "Income" : "Expense"} Added`;
  const message = `Successfully recorded ৳${transaction.amount} ${
    isIncome ? "income" : "expense"
  } for ${transaction.category}${
    transaction.note ? ` - ${transaction.note}` : ""
  }`;

  await createNotificationInDB(userId, {
    title,
    message,
    type: "success",
    metadata: {
      transaction_id: transaction.id,
      action: "transaction_created",
    },
  });
};

export const updateTransactionNotification = async (
  userId: string,
  transaction: {
    id: string;
    type: "income" | "expense";
    amount: number;
    category: string;
  }
) => {
  await createNotificationInDB(userId, {
    title: "Transaction Updated",
    message: `${transaction.type === "income" ? "Income" : "Expense"} of ৳${
      transaction.amount
    } has been updated`,
    type: "info",
    metadata: {
      transaction_id: transaction.id,
      action: "transaction_updated",
    },
  });
};

export const deleteTransactionNotification = async (
  userId: string,
  transactionData: {
    id: string;
    type: "income" | "expense";
    amount: number;
  }
) => {
  await createNotificationInDB(userId, {
    title: "Transaction Deleted",
    message: `${transactionData.type === "income" ? "Income" : "Expense"} of ৳${
      transactionData.amount
    } has been removed`,
    type: "warning",
    metadata: {
      transaction_id: transactionData.id,
      action: "transaction_deleted",
    },
  });
};

export const importTransactionsNotification = async (
  userId: string,
  count: number
) => {
  await createNotificationInDB(userId, {
    title: "Transactions Imported",
    message: `Successfully imported ${count} transaction${
      count > 1 ? "s" : ""
    } from your file`,
    type: "success",
    metadata: {
      action: "transactions_imported",
      count,
    },
  });
};

// Book-related notification helpers
export const createBookNotification = async (
  userId: string,
  book: {
    id: string;
    name: string;
    type: "personal" | "business";
  }
) => {
  await createNotificationInDB(userId, {
    title: "Book Created",
    message: `New ${book.type} book "${book.name}" has been created`,
    type: "info",
    metadata: {
      book_id: book.id,
      action: "book_created",
    },
  });
};

export const updateBookNotification = async (
  userId: string,
  book: {
    id: string;
    name: string;
  }
) => {
  await createNotificationInDB(userId, {
    title: "Book Updated",
    message: `Book "${book.name}" has been updated`,
    type: "info",
    metadata: {
      book_id: book.id,
      action: "book_updated",
    },
  });
};

export const deleteBookNotification = async (
  userId: string,
  bookName: string
) => {
  await createNotificationInDB(userId, {
    title: "Book Deleted",
    message: `Book "${bookName}" has been removed`,
    type: "warning",
    metadata: {
      action: "book_deleted",
    },
  });
};

export const setBudgetNotification = async (
  userId: string,
  data: {
    bookName: string;
    month: string;
    amount: number;
  }
) => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const [year, monthNum] = data.month.split("-");
  const monthName = monthNames[parseInt(monthNum) - 1];

  await createNotificationInDB(userId, {
    title: "Monthly Budget Set",
    message: `Budget of ৳${data.amount} set for ${monthName} ${year} in "${data.bookName}"`,
    type: "info",
    metadata: {
      action: "budget_set",
      month: data.month,
      amount: data.amount,
    },
  });
};

// Budget-related notifications
export const budgetExceededNotification = async (
  userId: string,
  data: {
    bookName: string;
    month: string;
    budget: number;
    spent: number;
    percentage: number;
  }
) => {
  let type: NotificationType = "warning";
  let title = "Budget Warning";
  let message = `You've spent ${data.percentage.toFixed(
    1
  )}% of your monthly budget in "${data.bookName}"`;

  if (data.percentage >= 100) {
    type = "error";
    title = "Budget Exceeded";
    message = `You've exceeded your monthly budget of ৳${data.budget} in "${data.bookName}". Current spending: ৳${data.spent}`;
  } else if (data.percentage >= 80) {
    title = "Budget Alert";
    message = `You've used ${data.percentage.toFixed(1)}% of your ৳${
      data.budget
    } budget in "${data.bookName}"`;
  }

  await createNotificationInDB(userId, {
    title,
    message,
    type,
    metadata: {
      action: "budget_alert",
      month: data.month,
      budget: data.budget,
      spent: data.spent,
      percentage: data.percentage,
    },
  });
};

// Report-related notifications
export const reportGeneratedNotification = async (
  userId: string,
  reportType: string,
  period: string
) => {
  await createNotificationInDB(userId, {
    title: "Report Generated",
    message: `Your ${reportType} report for ${period} is now available for download`,
    type: "info",
    metadata: {
      action: "report_generated",
      reportType,
      period,
    },
  });
};

// System notifications
export const systemMaintenanceNotification = async (
  userId: string,
  message: string,
  scheduledTime?: string
) => {
  await createNotificationInDB(userId, {
    title: "System Maintenance",
    message: scheduledTime
      ? `${message}. Scheduled for ${scheduledTime}`
      : message,
    type: "warning",
    metadata: {
      action: "system_maintenance",
      scheduledTime,
    },
  });
};

export const welcomeNotification = async (
  userId: string,
  userName?: string
) => {
  await createNotificationInDB(userId, {
    title: "Welcome to Financial Hive!",
    message: `${
      userName ? `Hi ${userName}! ` : ""
    }Welcome to Financial Hive. Start by creating your first book to track your expenses and income.`,
    type: "info",
    metadata: {
      action: "welcome",
    },
  });
};

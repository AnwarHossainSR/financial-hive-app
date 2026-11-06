// Server code: the client imports only the Reads type (see src/lib/read.ts)
import { getBooksAction } from "@/app/actions/books";
import { getBudgetsAction } from "@/app/actions/budgets";
import {
  getNotificationsAction,
  getUnreadCountAction,
} from "@/app/actions/notifications";
import { getIsolatedInvestmentPlatformsAction } from "@/app/actions/platform-actions";
import {
  getCategoryTotalsAction,
  getPeriodTotalsAction,
  getTransactionTotalsAction,
  getTransactionsAction,
} from "@/app/actions/transactions";
import { getProfileRole } from "@/app/actions/user-settings";

/**
 * Reads that pages make on load, served by /api/read/[name] instead of as
 * Server Actions: the browser runs Server Actions one at a time, so a page
 * with nine of them waited for nine round trips back to back. Route requests
 * run in parallel. Every function still checks the session itself, and all
 * of them return plain JSON (dates as strings, amounts as numbers).
 */
export const READS = {
  books: getBooksAction,
  transactions: getTransactionsAction,
  transactionTotals: getTransactionTotalsAction,
  periodTotals: getPeriodTotalsAction,
  categoryTotals: getCategoryTotalsAction,
  platforms: getIsolatedInvestmentPlatformsAction,
  budgets: getBudgetsAction,
  notifications: getNotificationsAction,
  unreadCount: getUnreadCountAction,
  profileRole: getProfileRole,
};

export type Reads = typeof READS;

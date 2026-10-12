import { clsx, type ClassValue } from "clsx";
import {
  endOfDay,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { enUS } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return "";
  try {
    const localDate = new Date(dateString);
    const bangladeshTime = toZonedTime(localDate, "Asia/Dhaka");

    return format(bangladeshTime, "EEE, MMM d, yyyy 'at' h:mm a '(BD Time)'", {
      locale: enUS,
    });
  } catch (error) {
    return "Invalid date";
  }
};

// Helper function to get current time in Bangladesh timezone (Asia/Dhaka)
export const getBangladeshTime = (
  date: Date | string | number | null = null,
) => {
  const dateToUse = date ? new Date(date) : new Date();
  const bangladeshTime = toZonedTime(dateToUse, "Asia/Dhaka");
  return format(bangladeshTime, "yyyy-MM-dd'T'HH:mm");
};

// Categories from TransactionForm
export const INCOME_CATEGORIES = [
  "Salary",
  "Bonus",
  "Encashment",
  "Freelance",
  "Investment",
  "Business",
  "Gift",
  "Other Income",
];

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Bike Maintenance",
  "Home Rent",
  "Donations",
  "Marriage",
  "Wife",
  "Other",
];

// A transaction can have multiple categories. They are stored in the existing
// `category` text column joined by CATEGORY_SEPARATOR, so legacy single-category
// rows remain valid as-is.
export const CATEGORY_SEPARATOR = ", ";

export const parseCategories = (category?: string | null): string[] =>
  (category || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

export const joinCategories = (categories: string[]): string =>
  [...new Set(categories.map((c) => c.trim()).filter(Boolean))].join(
    CATEGORY_SEPARATOR,
  );

/** "YYYY-MM" for the current month in the viewer's local time */
export const getCurrentMonth = () => format(new Date(), "yyyy-MM");

export const getMonthDateRange = (monthString: string) => {
  const [year, month] = monthString.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1); // month is 0-based

  const startDate = startOfMonth(date).toISOString();
  const endDate = endOfMonth(date).toISOString();

  return { startDate, endDate };
};

/**
 * The period to compare a month against for trends. For the current month it's
 * the same days of last month (Sep 1–12 vs Oct 1–12), so a half-finished month
 * isn't measured against a full one. For past months it's the whole prior month.
 */
export const getPreviousPeriodRange = (monthString: string) => {
  const [year, month] = monthString.split("-").map(Number);
  const selected = new Date(year, month - 1);
  const previous = subMonths(selected, 1);
  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() === month - 1;

  const startDate = startOfMonth(previous);
  // subMonths clamps (Mar 31 -> Feb 28), so this never spills into this month
  const endDate = isCurrentMonth
    ? endOfDay(subMonths(now, 1))
    : endOfMonth(previous);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    label: isCurrentMonth
      ? `vs ${format(startDate, "MMM d")}–${format(endDate, "d")}`
      : `vs ${format(previous, "MMM")}`,
  };
};

export const formatCurrency = (amount: number | string) => {
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

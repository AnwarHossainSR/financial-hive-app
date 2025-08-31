import { clsx, type ClassValue } from "clsx";
import { endOfMonth, format, startOfMonth } from "date-fns";
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
export const getBangladeshTime = (date = null) => {
  if (!date) date = new Date();
  const bangladeshTime = toZonedTime(date, "Asia/Dhaka");
  return format(bangladeshTime, "yyyy-MM-dd'T'HH:mm");
};

// Categories from TransactionForm
export const INCOME_CATEGORIES = [
  "Salary",
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
  "Other",
];

export const getMonthDateRange = (monthString: string) => {
  const [year, month] = monthString.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1); // month is 0-based

  const startDate = format(startOfMonth(date), "yyyy-MM-dd");
  const endDate = format(endOfMonth(date), "yyyy-MM-dd");

  return { startDate, endDate };
};

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
  "Other",
];

export const getMonthDateRange = (monthString: string) => {
  const [year, month] = monthString.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1); // month is 0-based

  const startDate = startOfMonth(date).toISOString();
  const endDate = endOfMonth(date).toISOString();

  return { startDate, endDate };
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

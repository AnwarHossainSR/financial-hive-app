import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
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

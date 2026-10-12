import {
  Banknote,
  Bike,
  Briefcase,
  Building2,
  Car,
  Film,
  Gem,
  Gift,
  GraduationCap,
  HandHeart,
  Heart,
  HeartPulse,
  House,
  Laptop,
  type LucideIcon,
  Plane,
  Receipt,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Utensils,
  Wallet,
  Zap,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  // Income
  Salary: Briefcase,
  Bonus: Sparkles,
  Encashment: Banknote,
  Freelance: Laptop,
  Investment: TrendingUp,
  Business: Building2,
  Gift: Gift,
  "Other Income": Wallet,
  // Expense
  "Food & Dining": Utensils,
  Transportation: Car,
  Shopping: ShoppingBag,
  Entertainment: Film,
  "Bills & Utilities": Zap,
  Healthcare: HeartPulse,
  Education: GraduationCap,
  Travel: Plane,
  "Bike Maintenance": Bike,
  "Home Rent": House,
  Donations: HandHeart,
  Marriage: Gem,
  Wife: Heart,
  Other: Receipt,
};

export const getCategoryIcon = (
  category: string | undefined,
  type: "income" | "expense",
): LucideIcon =>
  (category && CATEGORY_ICONS[category]) ||
  (type === "income" ? Wallet : Receipt);

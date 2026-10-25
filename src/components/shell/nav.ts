import {
  LayoutDashboard,
  type LucideIcon,
  Settings,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  /** Shown in the mobile bottom bar */
  mobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { href: "/investments", label: "Investments", icon: TrendingUp, mobile: true },
  { href: "/profile", label: "Profile", icon: UserRound, mobile: true },
  { href: "/settings", label: "Settings", icon: Settings, mobile: true },
  { href: "/users", label: "Users", icon: Users, adminOnly: true },
];

export const isNavActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export const getInitials = (name?: string | null) =>
  (name || "U")
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

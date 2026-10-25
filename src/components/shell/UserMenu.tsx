"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { cn } from "@/lib/utils";
import { ChevronsUpDown, LogOut, Settings, UserRound, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { getInitials } from "./nav";

interface UserMenuProps {
  /** "full" shows name and email next to the avatar (sidebar footer) */
  variant?: "avatar" | "full";
  className?: string;
}

export function UserMenu({ variant = "avatar", className }: UserMenuProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();

  const displayName =
    user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const avatarUrl = user?.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
      toast({
        title: "Signed out",
        description: "You have been logged out of your account.",
      });
    } catch {
      toast({
        title: "Sign out failed",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const avatar = (
    <Avatar className="h-9 w-9 ring-2 ring-background">
      <AvatarImage src={avatarUrl} alt="" />
      <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-white">
        {getInitials(displayName)}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className={cn(
          "flex items-center gap-3 rounded-xl text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          variant === "full" &&
            "w-full p-2 hover:bg-muted md:justify-center lg:justify-start",
          variant === "avatar" && "rounded-full",
          className,
        )}
      >
        {avatar}
        {variant === "full" && (
          <>
            <span className="hidden min-w-0 flex-1 lg:block">
              <span className="block truncate text-sm font-semibold text-foreground">
                {displayName}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            </span>
            <ChevronsUpDown className="hidden h-4 w-4 shrink-0 text-muted-foreground lg:block" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={variant === "full" ? "start" : "end"}
        side={variant === "full" ? "top" : "bottom"}
        className="w-60 rounded-xl"
      >
        <DropdownMenuLabel className="flex items-center gap-3 py-2 font-normal">
          {avatar}
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {displayName}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {user?.email}
            </span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onClick={() => router.push("/profile")}
        >
          <UserRound className="h-4 w-4 text-muted-foreground" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onClick={() => router.push("/settings")}
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
          Settings
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onClick={() => router.push("/users")}
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            Users
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

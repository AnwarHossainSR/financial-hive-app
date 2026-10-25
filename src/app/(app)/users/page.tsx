"use client";

import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { getInitials } from "@/components/shell/nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfileRole } from "@/hooks/useIsAdmin";
import { useUsers } from "@/hooks/useUsers";
import { useVirtualScroll } from "@/hooks/useVirtualScroll";
import { cn } from "@/lib/utils";
import { debounce } from "lodash";
import {
  Crown,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  UserRound,
  Users as UsersIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

// Fixed row heights so virtual-scroll offsets stay exact
const ITEM_HEIGHT_MOBILE = 132;
const ITEM_HEIGHT_DESKTOP = 72;
const CONTAINER_HEIGHT = 600;

interface UserRow {
  id: string;
  email: string;
  role?: string;
  created_at: string;
  last_sign_in_at?: string;
  user_metadata?: { display_name?: string; avatar_url?: string };
}

const ROLE_STYLES: Record<string, { className: string; icon: typeof Crown }> = {
  admin: { className: "bg-primary/10 text-primary ring-primary/20", icon: Crown },
  moderator: {
    className:
      "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400",
    icon: Shield,
  },
  user: { className: "bg-muted text-muted-foreground ring-border", icon: UserRound },
};

function RoleBadge({ role = "user" }: { role?: string }) {
  const style = ROLE_STYLES[role] ?? ROLE_STYLES.user;
  const Icon = style.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset",
        style.className,
      )}
    >
      <Icon className="h-3 w-3" />
      {role}
    </span>
  );
}

const shortDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const nameOf = (user: UserRow) =>
  user.user_metadata?.display_name || user.email?.split("@")[0] || "Unknown user";

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { role, isLoading: roleLoading } = useProfileRole();
  const isMobile = useIsMobile();

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"created_at" | "email">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [userToDelete, setUserToDelete] = useState<UserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    users,
    loading,
    totalUsers,
    isAdmin,
    updateUserRole,
    deleteUser,
    fetchUsers,
    loadMore,
    hasNextPage,
    loadingMore,
  } = useUsers({
    searchTerm,
    roleFilter: roleFilter === "all" ? undefined : roleFilter,
    sortBy,
    sortOrder,
  });

  // One debounced setter for the life of the page
  const debouncedSearch = useMemo(
    () => debounce((term: string) => setSearchTerm(term), 300),
    [],
  );

  const itemHeight = isMobile ? ITEM_HEIGHT_MOBILE : ITEM_HEIGHT_DESKTOP;
  const rows = users as UserRow[];
  const viewportHeight = Math.min(CONTAINER_HEIGHT, rows.length * itemHeight + 8);

  const { containerRef, startIndex, endIndex, offsetY, handleScroll } =
    useVirtualScroll({
      itemHeight,
      containerHeight: viewportHeight,
      totalItems: rows.length,
      overscan: 5,
      // Next page, not a reload of the first one
      onLoadMore: loadMore,
      hasNextPage,
      loadingMore,
      threshold: 200,
    });

  const visibleUsers = rows.slice(startIndex, endIndex);

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      toast({
        title: "Role updated",
        description: "The user's role has been changed.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true);
    try {
      await deleteUser(userId);
      toast({
        title: "User deleted",
        description: "The user has been permanently deleted.",
      });
      setUserToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="rounded-2xl border bg-card shadow-card">
        <EmptyState
          icon={ShieldOff}
          title="Admins only"
          description="You don't have permission to manage users. Ask an admin if you need access."
        />
      </div>
    );
  }

  const roleSelect = (row: UserRow, className?: string) => (
    <Select
      value={row.role || "user"}
      onValueChange={(value) => handleRoleUpdate(row.id, value)}
      disabled={row.id === user?.id}
    >
      <SelectTrigger
        aria-label={`Role for ${row.email}`}
        className={cn("h-9 rounded-xl text-xs", className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="user">User</SelectItem>
        <SelectItem value="moderator">Moderator</SelectItem>
        <SelectItem value="admin">Admin</SelectItem>
      </SelectContent>
    </Select>
  );

  const deleteButton = (row: UserRow) => (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Delete ${row.email}`}
      onClick={() => setUserToDelete(row)}
      disabled={row.id === user?.id}
      className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );

  const avatar = (row: UserRow, size: string) => (
    <Avatar className={cn("shrink-0", size)}>
      <AvatarImage src={row.user_metadata?.avatar_url} alt="" />
      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
        {getInitials(nameOf(row))}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Users"
        description={`${totalUsers.toLocaleString()} registered user${totalUsers === 1 ? "" : "s"}. Change roles or remove accounts.`}
        actions={
          <Button
            variant="outline"
            onClick={() => fetchUsers()}
            disabled={loading}
            className="gap-2 rounded-xl"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      <section className="overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:p-5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search users"
              placeholder="Search by email…"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                debouncedSearch(e.target.value);
              }}
              className="h-10 rounded-xl pl-9"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger aria-label="Role" className="h-10 rounded-xl sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="moderator">Moderators</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as typeof sortBy)}
            >
              <SelectTrigger aria-label="Sort by" className="h-10 rounded-xl sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Join date</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortOrder}
              onValueChange={(value) => setSortOrder(value as typeof sortOrder)}
            >
              <SelectTrigger aria-label="Order" className="h-10 rounded-xl sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">
                  {sortBy === "email" ? "Z → A" : "Newest first"}
                </SelectItem>
                <SelectItem value="asc">
                  {sortBy === "email" ? "A → Z" : "Oldest first"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Loading users…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No users found"
            description="Try a different search or role filter."
          />
        ) : (
          <>
            {!isMobile && (
              <div className="grid grid-cols-12 gap-4 border-b bg-muted/40 px-5 py-2.5 text-xs font-medium text-muted-foreground">
                <div className="col-span-3">User</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
            )}
            <div
              ref={containerRef}
              onScroll={handleScroll}
              className="overflow-auto overscroll-contain"
              style={{ height: viewportHeight }}
            >
              <div
                className="relative"
                style={{ height: rows.length * itemHeight }}
              >
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                  {visibleUsers.map((row) =>
                    isMobile ? (
                      <div
                        key={row.id}
                        style={{ height: ITEM_HEIGHT_MOBILE }}
                        className="space-y-3 border-b px-4 py-3.5"
                      >
                        <div className="flex items-start gap-3">
                          {avatar(row, "h-10 w-10")}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="truncate text-sm font-semibold">
                                {nameOf(row)}
                              </p>
                              <RoleBadge role={row.role} />
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {row.email}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Joined {shortDate(row.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {roleSelect(row, "flex-1")}
                          {deleteButton(row)}
                        </div>
                      </div>
                    ) : (
                      <div
                        key={row.id}
                        style={{ height: ITEM_HEIGHT_DESKTOP }}
                        className="grid grid-cols-12 items-center gap-4 border-b px-5 transition-colors hover:bg-muted/40"
                      >
                        <div className="col-span-3 flex min-w-0 items-center gap-3">
                          {avatar(row, "h-9 w-9")}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {nameOf(row)}
                              {row.id === user?.id && (
                                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {row.last_sign_in_at
                                ? `Last seen ${shortDate(row.last_sign_in_at)}`
                                : "Never signed in"}
                            </p>
                          </div>
                        </div>
                        <div className="col-span-3 truncate text-sm text-muted-foreground">
                          {row.email}
                        </div>
                        <div className="col-span-2">
                          <RoleBadge role={row.role} />
                        </div>
                        <div className="col-span-2 text-sm text-muted-foreground">
                          {shortDate(row.created_at)}
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-1">
                          {roleSelect(row, "w-[110px]")}
                          {deleteButton(row)}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
            {loadingMore && (
              <div className="flex items-center justify-center gap-2 border-t py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading more users…
              </div>
            )}
          </>
        )}
      </section>

      {userToDelete && isAdmin && (
        <DeleteConfirmationModal
          open={!!userToDelete}
          onOpenChange={(open) => !open && setUserToDelete(null)}
          onConfirmDelete={handleDeleteUser}
          isDeleting={isDeleting}
          itemId={userToDelete.id}
          title="Delete this user?"
          description={`The profile, books, transactions, budgets and settings of ${userToDelete.email} will be permanently deleted.`}
          deleteButtonText="Delete user"
          verificationText="DELETE"
        />
      )}
    </div>
  );
}

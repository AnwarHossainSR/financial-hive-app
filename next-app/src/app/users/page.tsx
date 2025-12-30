"use client";

import { Header } from "@/components/Header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { useVirtualScroll } from "@/hooks/useVirtualScroll";
import { debounce } from "lodash";
import {
  Calendar,
  Crown,
  Filter,
  Mail,
  Search,
  Shield,
  Trash2,
  User,
  Users as UsersIcon,
  UserX,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"created_at" | "email">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const isMobile = useIsMobile();

  const {
    users,
    loading,
    totalUsers,
    isAdmin,
    updateUserRole,
    deleteUser,
    fetchUsers,
    hasNextPage,
    loadingMore,
  } = useUsers({
    searchTerm,
    roleFilter: roleFilter === "all" ? undefined : roleFilter,
    sortBy,
    sortOrder,
  });

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
    }, 300),
    []
  );

  // Responsive item heights
  const ITEM_HEIGHT_MOBILE = 140; // Taller for mobile layout
  const ITEM_HEIGHT_DESKTOP = 80; // Compact table row height
  const CONTAINER_HEIGHT = 600;

  const ITEM_HEIGHT = isMobile ? ITEM_HEIGHT_MOBILE : ITEM_HEIGHT_DESKTOP;

  const { containerRef, startIndex, endIndex, offsetY, handleScroll } =
    useVirtualScroll({
      itemHeight: ITEM_HEIGHT,
      containerHeight: CONTAINER_HEIGHT,
      totalItems: users.length,
      overscan: 5,
      onLoadMore: fetchUsers,
      hasNextPage,
      loadingMore,
      threshold: 200,
    });

  // Get visible users for virtual scrolling
  const visibleUsers = useMemo(() => {
    return users.slice(startIndex, endIndex);
  }, [users, startIndex, endIndex]);

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (
      !confirm(
        `Are you sure you want to delete user ${userEmail}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteUser(userId);
      toast({
        title: "User deleted",
        description: "User has been permanently deleted.",
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getInitials = (email: string) => {
    return email?.charAt(0)?.toUpperCase() || "U";
  };

  const formatDateMobile = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "moderator":
        return "default";
      case "user":
      default:
        return "secondary";
    }
  };

  // Mobile User Card Component
  const MobileUserCard = ({ userItem }: { userItem: any }) => (
    <div className="p-4 border-b border-border/50 last:border-b-0">
      <div className="space-y-3">
        {/* Top Row: Avatar, Name, Role */}
        <div className="flex items-start gap-3">
          <Avatar className="w-12 h-12 ring-2 ring-primary/10 flex-shrink-0">
            <AvatarImage src={userItem.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground">
              {getInitials(userItem.email || "")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground text-sm truncate">
                  {userItem.user_metadata?.display_name ||
                    userItem.email?.split("@")[0] ||
                    "Unknown User"}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {userItem.email}
                </p>
              </div>

              <Badge
                variant={getRoleBadgeColor(userItem.role || "user")}
                className="rounded-full text-xs flex-shrink-0"
              >
                {userItem.role === "admin" && (
                  <Crown className="w-3 h-3 mr-1" />
                )}
                {userItem.role === "moderator" && (
                  <Shield className="w-3 h-3 mr-1" />
                )}
                {(!userItem.role || userItem.role === "user") && (
                  <User className="w-3 h-3 mr-1" />
                )}
                {userItem.role || "user"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Second Row: Dates */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>Joined {formatDateMobile(userItem.created_at)}</span>
          </div>
          {userItem.last_sign_in_at && (
            <div className="flex items-center gap-1">
              <span>
                Last seen {formatDateMobile(userItem.last_sign_in_at)}
              </span>
            </div>
          )}
        </div>

        {/* Third Row: Actions */}
        <div className="flex items-center gap-2">
          <Select
            value={userItem.role || "user"}
            onValueChange={(value) => handleRoleUpdate(userItem.id, value)}
            disabled={userItem.id === user?.id}
          >
            <SelectTrigger className="flex-1 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteUser(userItem.id, userItem.email || "")}
            disabled={userItem.id === user?.id}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 px-3"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Desktop User Card Component (Table Row)
  const DesktopUserCard = ({ userItem }: { userItem: any }) => (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center h-[80px]">
      {/* User Info - 4 cols */}
      <div className="col-span-4 flex items-center gap-3 min-w-0">
        <Avatar className="w-10 h-10 ring-2 ring-primary/10 flex-shrink-0">
          <AvatarImage src={userItem.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-sm">
            {getInitials(userItem.email || "")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground truncate text-sm">
            {userItem.user_metadata?.display_name ||
              userItem.email?.split("@")[0] ||
              "Unknown User"}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {userItem.last_sign_in_at
              ? `Last seen ${formatDateMobile(userItem.last_sign_in_at)}`
              : "Never signed in"}
          </p>
        </div>
      </div>

      {/* Email - 3 cols */}
      <div className="col-span-3 min-w-0">
        <div className="flex items-center gap-2">
          <Mail className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-foreground truncate">
            {userItem.email}
          </span>
        </div>
      </div>

      {/* Role - 2 cols */}
      <div className="col-span-2">
        <Badge
          variant={getRoleBadgeColor(userItem.role || "user")}
          className="rounded-full text-xs inline-flex items-center gap-1"
        >
          {userItem.role === "admin" && <Crown className="w-3 h-3" />}
          {userItem.role === "moderator" && <Shield className="w-3 h-3" />}
          {(!userItem.role || userItem.role === "user") && (
            <User className="w-3 h-3" />
          )}
          {userItem.role || "user"}
        </Badge>
      </div>

      {/* Join Date - 2 cols */}
      <div className="col-span-2">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {formatDateMobile(userItem.created_at)}
          </span>
        </div>
      </div>

      {/* Actions - 1 col */}
      <div className="col-span-1 flex items-center justify-center gap-1">
        <Select
          value={userItem.role || "user"}
          onValueChange={(value) => handleRoleUpdate(userItem.id, value)}
          disabled={userItem.id === user?.id}
        >
          <SelectTrigger className="w-[90px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteUser(userItem.id, userItem.email || "")}
          disabled={userItem.id === user?.id}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Header
          showImportExport={false}
          title="CashBook"
          subtitle="Access Denied"
        />
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border-none shadow-xl bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
              <CardContent className="pt-12 pb-8">
                <UserX className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Access Denied
                </h1>
                <p className="text-muted-foreground">
                  You don't have permission to view user management.
                  <br />
                  Admin access is required.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header
        showImportExport={false}
        title="CashBook"
        subtitle="User Management"
      />

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Users Header */}
          <Card className="border-none shadow-xl bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="w-16 h-16 md:w-24 md:h-24 ring-4 ring-primary/10">
                  <AvatarFallback className="text-xl md:text-2xl bg-gradient-primary text-primary-foreground">
                    <UsersIcon className="w-6 h-6 md:w-8 md:h-8" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 w-full">
                  <div className="flex flex-col gap-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                        User Management
                      </h1>
                      <p className="text-muted-foreground text-sm md:text-base">
                        Manage all users, roles, and permissions
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge
                          variant="secondary"
                          className="rounded-full text-xs"
                        >
                          <UsersIcon className="w-3 h-3 mr-1" />
                          {totalUsers} Total Users
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-full text-xs"
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          Admin Panel
                        </Badge>
                      </div>
                    </div>

                    <div className="w-max-15">
                      <Button
                        onClick={() => fetchUsers()}
                        disabled={loading}
                        className="bg-gradient-primary text-primary-foreground hover:opacity-90 rounded-lg w-full sm:w-auto"
                      >
                        {loading ? (
                          <Loader size="sm" />
                        ) : (
                          <UsersIcon className="w-4 h-4 mr-2" />
                        )}
                        Refresh Users
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters and Search */}
          <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="hidden sm:inline">Filters & Search</span>
                <span className="sm:hidden">Search</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="search" className="text-sm">
                    Search Users
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by email..."
                      className="pl-10"
                      onChange={(e) => debouncedSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="role-filter" className="text-sm">
                    Role Filter
                  </Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger id="role-filter">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sort-by" className="text-sm">
                    Sort By
                  </Label>
                  <Select
                    value={sortBy}
                    onValueChange={(value: any) => setSortBy(value)}
                  >
                    <SelectTrigger id="sort-by">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Join Date</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="last_sign_in">Last Sign In</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sort-order" className="text-sm">
                    Order
                  </Label>
                  <Select
                    value={sortOrder}
                    onValueChange={(value: any) => setSortOrder(value)}
                  >
                    <SelectTrigger id="sort-order">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card className="border-none shadow-lg rounded-xl bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl flex items-center justify-center shadow-sm">
                    <UsersIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                      All Users
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {totalUsers} registered users
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="hidden sm:flex rounded-full px-3 py-1"
                >
                  {totalUsers}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="px-0 sm:px-6">
              {loading && users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mb-4">
                    <Loader size="lg" />
                  </div>
                  <p className="text-muted-foreground text-center">
                    Loading users...
                  </p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <UsersIcon className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No users found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Mobile List View */}
                  <div className="block lg:hidden">
                    <div
                      ref={containerRef}
                      className="max-h-[70vh] overflow-auto"
                      onScroll={handleScroll}
                    >
                      <div
                        style={{
                          height: users.length * ITEM_HEIGHT_MOBILE,
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            transform: `translateY(${offsetY}px)`,
                          }}
                        >
                          {visibleUsers.map((userItem) => (
                            <div
                              key={userItem.id}
                              style={{ height: ITEM_HEIGHT_MOBILE }}
                              className="border-b border-border/30 last:border-b-0"
                            >
                              <MobileUserCard userItem={userItem} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-2 text-sm font-medium text-muted-foreground">
                      <div className="col-span-4">User</div>
                      <div className="col-span-3">Email</div>
                      <div className="col-span-2">Role</div>
                      <div className="col-span-2">Joined</div>
                      <div className="col-span-1 text-center">Actions</div>
                    </div>

                    {/* Table Body */}
                    <div
                      ref={containerRef}
                      className="max-h-[60vh] overflow-auto"
                      onScroll={handleScroll}
                    >
                      <div
                        style={{
                          height: users.length * ITEM_HEIGHT_DESKTOP,
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            transform: `translateY(${offsetY}px)`,
                          }}
                        >
                          {visibleUsers.map((userItem) => (
                            <div
                              key={userItem.id}
                              style={{ height: ITEM_HEIGHT_DESKTOP }}
                              className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-border/20 last:border-b-0"
                            >
                              <DesktopUserCard userItem={userItem} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {loadingMore && (
                    <div className="flex items-center justify-center py-6 border-t border-border/30">
                      <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-full">
                        <Loader size="sm" />
                        <span className="text-sm text-muted-foreground">
                          Loading more users...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

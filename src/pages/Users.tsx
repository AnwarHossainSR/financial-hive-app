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

const Users = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"created_at" | "email" | "last_sign_in">(
    "created_at"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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

  // Virtual scrolling configuration
  const ITEM_HEIGHT = 120; // Height of each user card
  const CONTAINER_HEIGHT = 600; // Height of the scrollable container

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
                <Avatar className="w-24 h-24 ring-4 ring-primary/10">
                  <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                    <UsersIcon className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">
                        User Management
                      </h1>
                      <p className="text-muted-foreground">
                        Manage all users, roles, and permissions
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="rounded-full">
                          <UsersIcon className="w-3 h-3 mr-1" />
                          {totalUsers} Total Users
                        </Badge>
                        <Badge variant="outline" className="rounded-full">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin Panel
                        </Badge>
                      </div>
                    </div>

                    <Button
                      onClick={() => fetchUsers()}
                      disabled={loading}
                      className="bg-gradient-primary text-primary-foreground hover:opacity-90 rounded-lg"
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
            </CardContent>
          </Card>

          {/* Filters and Search */}
          <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search Users</Label>
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
                  <Label htmlFor="role-filter">Role Filter</Label>
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
                  <Label htmlFor="sort-by">Sort By</Label>
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
                  <Label htmlFor="sort-order">Order</Label>
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
          <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                All Users ({totalUsers})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading && users.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader size="lg" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12">
                  <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
                <div
                  ref={containerRef}
                  className="h-[600px] overflow-auto"
                  onScroll={handleScroll}
                >
                  <div
                    style={{
                      height: users.length * ITEM_HEIGHT,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        transform: `translateY(${offsetY}px)`,
                      }}
                    >
                      {visibleUsers.map((userItem, index) => (
                        <div
                          key={userItem.id}
                          className="h-[120px] p-4 border-b border-border/50 last:border-b-0"
                          style={{
                            height: ITEM_HEIGHT,
                          }}
                        >
                          <div className="flex items-center gap-4 h-full">
                            <Avatar className="w-12 h-12 ring-2 ring-primary/10">
                              <AvatarImage
                                src={userItem.user_metadata?.avatar_url}
                              />
                              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                                {getInitials(userItem.email || "")}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-foreground truncate">
                                  {userItem.user_metadata?.display_name ||
                                    userItem.email?.split("@")[0] ||
                                    "Unknown User"}
                                </h3>
                                <Badge
                                  variant={getRoleBadgeColor(
                                    userItem.role || "user"
                                  )}
                                  className="rounded-full text-xs"
                                >
                                  {userItem.role === "admin" && (
                                    <Crown className="w-3 h-3 mr-1" />
                                  )}
                                  {userItem.role === "moderator" && (
                                    <Shield className="w-3 h-3 mr-1" />
                                  )}
                                  {(!userItem.role ||
                                    userItem.role === "user") && (
                                    <User className="w-3 h-3 mr-1" />
                                  )}
                                  {userItem.role || "user"}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">
                                    {userItem.email}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    Joined {formatDate(userItem.created_at)}
                                  </span>
                                </div>
                                {userItem.last_sign_in_at && (
                                  <div className="flex items-center gap-1">
                                    <span>
                                      Last seen{" "}
                                      {formatDate(userItem.last_sign_in_at)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Select
                                value={userItem.role || "user"}
                                onValueChange={(value) =>
                                  handleRoleUpdate(userItem.id, value)
                                }
                                disabled={userItem.id === user?.id}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="moderator">
                                    Moderator
                                  </SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDeleteUser(
                                    userItem.id,
                                    userItem.email || ""
                                  )
                                }
                                disabled={userItem.id === user?.id}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {loadingMore && (
                    <div className="flex items-center justify-center py-4">
                      <Loader size="sm" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading more users...
                      </span>
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
};

export default Users;

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Info,
  Loader2,
  X,
} from "lucide-react";
import { useState } from "react";

type NotificationType = "info" | "success" | "warning" | "error";

const TYPE_STYLES: Record<
  NotificationType,
  { icon: typeof Info; className: string }
> = {
  success: { icon: Check, className: "bg-income/10 text-income" },
  warning: {
    icon: AlertTriangle,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  error: { icon: X, className: "bg-expense/10 text-expense" },
  info: { icon: Info, className: "bg-primary/10 text-primary" },
};

const formatTimestamp = (timestamp: string) => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          className="relative h-9 w-9 rounded-full"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-expense px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[calc(100vw-2rem)] max-w-sm rounded-2xl p-0"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="h-8 gap-1.5 rounded-lg px-2 text-xs"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="h-8 rounded-lg px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={loading}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="m-0" />

        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading notifications…
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BellOff className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium">No notifications yet</p>
            <p className="text-xs text-muted-foreground">
              Activity on your books will show up here.
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto overscroll-contain p-1.5">
              {notifications.map((notification) => {
                const style =
                  TYPE_STYLES[notification.type as NotificationType] ??
                  TYPE_STYLES.info;
                const Icon = style.icon;
                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className="group cursor-pointer items-start gap-3 rounded-xl p-3"
                    onSelect={(e) => {
                      e.preventDefault();
                      if (!notification.read) markAsRead(notification.id);
                    }}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        style.className,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-sm",
                            notification.read
                              ? "font-medium text-muted-foreground"
                              : "font-semibold",
                          )}
                        >
                          {notification.title}
                        </p>
                        <button
                          type="button"
                          aria-label="Remove notification"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="-mr-1 rounded-md p-0.5 text-muted-foreground opacity-60 transition-opacity hover:bg-muted hover:opacity-100 focus-visible:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
                        {!notification.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        )}
                        {formatTimestamp(notification.created_at)}
                      </p>
                    </div>
                  </DropdownMenuItem>
                );
              })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

import { Button } from "@/components/ui/button";
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
import { Download, Settings, Upload, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { NotificationDropdown } from "./NotificationDropdown";

interface HeaderProps {
  showImportExport?: boolean;
  onImportCSV?: () => void;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  title?: string;
  subtitle?: string;
}

export function Header({
  showImportExport = true,
  onImportCSV,
  onExportCSV,
  onExportPDF,
  title = "CashBook",
  subtitle,
}: HeaderProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImportCSV = () => {
    if (onImportCSV) {
      onImportCSV();
    } else {
      toast({
        title: "Import not available",
        description: "Import functionality is not available on this page.",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    if (onExportCSV) {
      onExportCSV();
    } else {
      toast({
        title: "Export not available",
        description: "CSV export functionality is not available on this page.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = () => {
    if (onExportPDF) {
      onExportPDF();
    } else {
      toast({
        title: "Export not available",
        description: "PDF export functionality is not available on this page.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Logo & Title */}
        <div className="flex items-center space-x-4">
          <div
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <img
                src="/cheque.png"
                className="w-5 h-5 text-primary-foreground"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold leading-none">{title}</h1>
              {subtitle && (
                <span className="text-xs text-muted-foreground">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Import/Export Menu - Only show if enabled */}
          {showImportExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-lg">
                  <Upload className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Import/Export</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleImportCSV}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-lg">
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="text-sm">
                  {user?.user_metadata?.display_name || user?.email || "User"}
                </div>
                {user?.email && (
                  <div className="text-xs text-muted-foreground font-normal">
                    {user.email}
                  </div>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/users")}>
                <User className="w-4 h-4 mr-2" />
                Users
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleSignOut}
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

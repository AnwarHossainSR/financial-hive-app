import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useUserSettings } from "@/hooks/useUserSettings";
import { debounce } from "lodash";
import {
  AlertTriangle,
  Bell,
  Database,
  Download,
  Save,
  Settings as SettingsIcon,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { useCallback } from "react";

export const Settings = () => {
  const { user } = useAuth();
  const { books } = useBooks();
  const { toast } = useToast();
  const {
    settings,
    isAdmin,
    loading,
    updateSettings,
    exportData,
    clearDatabase,
    deleteAccount,
  } = useUserSettings();

  // Debounced version of updateSettings
  const debouncedUpdateSettings = useCallback(
    debounce((newSettings: Partial<typeof settings>) => {
      updateSettings(newSettings);
    }, 500),
    [updateSettings]
  );

  const handleSaveSettings = async () => {
    try {
      await updateSettings(settings); // Immediate save without debounce
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleExportData = async (format: "csv" | "json") => {
    try {
      await exportData(format);
    } catch (error: any) {
      toast({
        title: "Error exporting data",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleClearDatabase = async () => {
    try {
      await clearDatabase();
    } catch (error: any) {
      toast({
        title: "Error clearing database",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header
        showImportExport={false}
        title="CashBook"
        subtitle="Account Settings"
      />

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Settings Header */}
          <Card className="border-none shadow-xl bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="w-24 h-24 ring-4 ring-primary/10">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                    {user?.email ? getInitials(user.email) : "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">
                        Account Settings
                      </h1>
                      <p className="text-muted-foreground">
                        Manage your account preferences and security settings
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="rounded-full">
                          <User className="w-3 h-3 mr-1" />
                          {user?.email?.split("@")[0] || "User"}
                        </Badge>
                        <Badge variant="outline" className="rounded-full">
                          <SettingsIcon className="w-3 h-3 mr-1" />
                          Settings
                        </Badge>
                        {isAdmin && (
                          <Badge variant="destructive" className="rounded-full">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveSettings}
                      disabled={loading}
                      className="bg-gradient-primary text-primary-foreground hover:opacity-90 rounded-lg"
                    >
                      {loading ? (
                        <Loader size="sm" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Settings */}
            <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email cannot be changed after registration
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="default-book">Default Book</Label>
                    <Select
                      value={settings.default_book_id || ""}
                      onValueChange={(value) =>
                        debouncedUpdateSettings({
                          default_book_id: value || null,
                        })
                      }
                    >
                      <SelectTrigger id="default-book" className="w-full">
                        <SelectValue placeholder="Select Default Book" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {books.map((book) => (
                          <SelectItem key={book.id} value={book.id}>
                            {book.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Input
                      id="currency"
                      placeholder="USD, BDT, EUR..."
                      value={settings.currency}
                      onChange={(e) =>
                        debouncedUpdateSettings({
                          currency: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-600">
                          Two-Factor Authentication
                        </p>
                        <p className="text-xs text-green-600/80">
                          Add an extra layer of security
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toast({
                            title: "2FA Not Implemented",
                            description:
                              "Two-Factor Authentication setup is not yet available.",
                          })
                        }
                      >
                        Enable
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Change Password</p>
                        <p className="text-xs text-muted-foreground">
                          Update your account password
                        </p>
                      </div>
                      <ChangePasswordDialog />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                    <div>
                      <p className="font-medium">Transaction Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified for new transactions
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.transactions}
                      onCheckedChange={(checked) =>
                        debouncedUpdateSettings({
                          notifications: {
                            ...settings.notifications,
                            transactions: checked,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                    <div>
                      <p className="font-medium">Book Updates</p>
                      <p className="text-sm text-muted-foreground">
                        Notifications for book changes
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.books}
                      onCheckedChange={(checked) =>
                        debouncedUpdateSettings({
                          notifications: {
                            ...settings.notifications,
                            books: checked,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                    <div>
                      <p className="font-medium">Monthly Reports</p>
                      <p className="text-sm text-muted-foreground">
                        Monthly financial summaries
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.reports}
                      onCheckedChange={(checked) =>
                        debouncedUpdateSettings({
                          notifications: {
                            ...settings.notifications,
                            reports: checked,
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) =>
                        debouncedUpdateSettings({
                          notifications: {
                            ...settings.notifications,
                            email: checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-600">Export Data</p>
                        <p className="text-xs text-blue-600/80">
                          Download all your financial data
                        </p>
                      </div>
                      <Select
                        value={settings.export_format}
                        onValueChange={(value) =>
                          debouncedUpdateSettings({
                            export_format: value as "csv" | "json",
                          })
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-blue-600 border-blue-200"
                      onClick={() =>
                        handleExportData(
                          settings.export_format as "csv" | "json"
                        )
                      }
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Account Backup</p>
                        <p className="text-xs text-muted-foreground">
                          Create a complete backup
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportData("json")}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Backup
                      </Button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Export your data in CSV or JSON formats
                </p>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-none shadow-card rounded-lg bg-white dark:bg-gray-800 bg-opacity-95 backdrop-blur-md border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                        Delete Account
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                        Permanently delete your account and all associated data.
                        This action cannot be undone.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={deleteAccount}
                      disabled={loading}
                      className="flex items-center gap-2 flex-shrink-0"
                    >
                      {loading ? (
                        <Loader size="sm" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete Account
                    </Button>
                  </div>
                </div>

                {isAdmin && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                          Clear Entire Database
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                          Permanently delete all data in the database. This
                          action cannot be undone and affects all users.
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleClearDatabase}
                        disabled={loading}
                        className="flex items-center gap-2 flex-shrink-0"
                      >
                        {loading ? (
                          <Loader size="sm" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Clear Database
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={loading}
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 rounded-lg px-8"
              >
                {loading ? (
                  <Loader size="sm" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save All Settings
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

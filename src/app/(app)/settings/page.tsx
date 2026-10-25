"use client";

import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { DeleteConfirmationModal } from "@/components/DeleteConfirmationModal";
import { PageHeader } from "@/components/PageHeader";
import { useTheme } from "@/components/ThemeProvider";
import { THEME_OPTIONS } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useUserSettings } from "@/hooks/useUserSettings";
import { cn } from "@/lib/utils";
import { Book } from "@/types/book";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";

function SettingsSection({
  title,
  description,
  children,
  danger = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section className="grid gap-4 border-t py-8 first:border-t-0 first:pt-0 md:grid-cols-3 md:gap-8">
      <div>
        <h2
          className={cn(
            "text-base font-semibold",
            danger && "text-destructive",
          )}
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div
        className={cn(
          "divide-y rounded-2xl border bg-card shadow-card md:col-span-2",
          danger && "border-destructive/30",
        )}
      >
        {children}
      </div>
    </section>
  );
}

function SettingRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const ComingSoon = () => (
  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
    Coming soon
  </span>
);

const NOTIFICATION_OPTIONS = [
  {
    key: "transactions" as const,
    label: "Transaction alerts",
    description: "When transactions are added or changed",
  },
  {
    key: "books" as const,
    label: "Book updates",
    description: "When books or budgets change",
  },
  {
    key: "reports" as const,
    label: "Monthly reports",
    description: "A summary at the end of each month",
  },
  {
    key: "email" as const,
    label: "Email notifications",
    description: "Also send notifications by email",
  },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { books } = useBooks();
  const { theme, setTheme } = useTheme();
  const { settings, isAdmin, loading, updateSettings, clearDatabase } =
    useUserSettings();
  const [currencyDraft, setCurrencyDraft] = useState<string | null>(null);
  const [showClearDatabase, setShowClearDatabase] = useState(false);
  const [clearing, setClearing] = useState(false);

  const currency = currencyDraft ?? settings.currency;

  // Saved when the field loses focus, not on every keystroke
  const saveCurrency = () => {
    const next = (currencyDraft ?? "").trim().toUpperCase();
    setCurrencyDraft(null);
    if (next && next !== settings.currency) updateSettings({ currency: next });
  };

  const handleClearDatabase = async () => {
    setClearing(true);
    try {
      await clearDatabase();
      setShowClearDatabase(false);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your preferences, security and data. Changes save automatically."
        actions={
          loading && (
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </span>
          )
        }
      />

      <div className="max-w-5xl">
        <SettingsSection
          title="Appearance"
          description="Choose how Financial Hive looks on this device."
        >
          <div className="p-4 sm:p-5">
            <div
              role="radiogroup"
              aria-label="Theme"
              className="grid grid-cols-3 gap-3"
            >
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                const selected = theme === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTheme(value)}
                    className={cn(
                      "group overflow-hidden rounded-xl border text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "border-primary ring-1 ring-primary"
                        : "hover:border-foreground/20",
                    )}
                  >
                    {/* Miniature of the app in that theme */}
                    <div
                      aria-hidden
                      className={cn(
                        "flex h-16 gap-1.5 p-2 sm:h-20",
                        value === "light" && "bg-slate-100",
                        value === "dark" && "bg-slate-900",
                        value === "system" &&
                          "bg-gradient-to-r from-slate-100 from-50% to-slate-900 to-50%",
                      )}
                    >
                      <div
                        className={cn(
                          "w-1/4 rounded-md",
                          value === "dark" ? "bg-slate-800" : "bg-white",
                        )}
                      />
                      <div className="flex flex-1 flex-col gap-1.5">
                        <div
                          className={cn(
                            "h-3 rounded",
                            value === "dark" ? "bg-slate-700" : "bg-white",
                          )}
                        />
                        <div className="h-3 w-2/3 rounded bg-indigo-500" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        {label}
                      </span>
                      {selected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Account"
          description="Your sign-in email and everyday preferences."
        >
          <SettingRow
            label="Email address"
            description="Can't be changed after registration"
            htmlFor="email"
          >
            <Input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className="h-10 w-full rounded-xl sm:w-64"
            />
          </SettingRow>
          <SettingRow
            label="Default book"
            description="The book you use most"
            htmlFor="default-book"
          >
            <Select
              value={settings.default_book_id || "none"}
              onValueChange={(value) =>
                updateSettings({
                  default_book_id: value === "none" ? null : value,
                })
              }
            >
              <SelectTrigger
                id="default-book"
                className="h-10 w-full rounded-xl sm:w-64"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {(books as Book[]).map((book) => (
                  <SelectItem key={book.id} value={book.id}>
                    {book.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow
            label="Default currency"
            description="Three-letter code, e.g. BDT"
            htmlFor="currency"
          >
            <Input
              id="currency"
              placeholder="BDT"
              maxLength={3}
              value={currency}
              onChange={(e) => setCurrencyDraft(e.target.value.toUpperCase())}
              onBlur={saveCurrency}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="h-10 w-full rounded-xl uppercase sm:w-64"
            />
          </SettingRow>
        </SettingsSection>

        <SettingsSection
          title="Security"
          description="Keep your account protected."
        >
          <SettingRow
            label="Password"
            description="Use a strong password you don't use elsewhere"
          >
            <ChangePasswordDialog />
          </SettingRow>
          <SettingRow
            label={
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-income" />
                Two-factor authentication
              </span>
            }
            description="An extra code when you sign in"
          >
            <ComingSoon />
          </SettingRow>
        </SettingsSection>

        <SettingsSection
          title="Notifications"
          description="Pick what you want to hear about."
        >
          {NOTIFICATION_OPTIONS.map((option) => (
            <SettingRow
              key={option.key}
              label={option.label}
              description={option.description}
              htmlFor={`notify-${option.key}`}
            >
              <Switch
                id={`notify-${option.key}`}
                checked={settings.notifications[option.key]}
                onCheckedChange={(checked) =>
                  updateSettings({
                    notifications: {
                      ...settings.notifications,
                      [option.key]: checked,
                    },
                  })
                }
              />
            </SettingRow>
          ))}
        </SettingsSection>

        <SettingsSection
          title="Data"
          description="Your records, in formats you can take anywhere."
        >
          <SettingRow
            label="Export format"
            description="Used for full-account exports"
            htmlFor="export-format"
          >
            <Select
              value={settings.export_format}
              onValueChange={(value) =>
                updateSettings({ export_format: value as "csv" | "json" })
              }
            >
              <SelectTrigger
                id="export-format"
                className="h-10 w-full rounded-xl sm:w-40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow
            label="Export all data"
            description="Every book is exportable today from its page (CSV or PDF)"
          >
            <ComingSoon />
          </SettingRow>
        </SettingsSection>

        <SettingsSection
          title="Danger zone"
          description="Irreversible actions. Take care."
          danger
        >
          <SettingRow
            label="Delete account"
            description="Permanently remove your account and all its data"
          >
            <ComingSoon />
          </SettingRow>
          {isAdmin && (
            <SettingRow
              label="Clear entire database"
              description="Deletes all data for every user. Admins only."
            >
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowClearDatabase(true)}
                className="rounded-xl"
              >
                Clear database
              </Button>
            </SettingRow>
          )}
        </SettingsSection>
      </div>

      <DeleteConfirmationModal
        open={showClearDatabase}
        onOpenChange={setShowClearDatabase}
        onConfirmDelete={handleClearDatabase}
        isDeleting={clearing}
        itemId="database"
        title="Clear the entire database?"
        description="Every user's books, transactions, budgets, settings, notifications and profiles will be permanently deleted."
        deleteButtonText="Clear database"
        verificationText="CLEAR"
      />
    </div>
  );
}

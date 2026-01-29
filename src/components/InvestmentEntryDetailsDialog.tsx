"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarDays,
  CreditCard,
  Download,
  Edit,
  Percent,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { EditInvestmentEntryDialog } from "./EditInvestmentEntryDialog";

interface InvestmentEntryDetailsDialogProps {
  entry: any;
  projectId: string;
  children: React.ReactNode;
  onDelete?: (entryId: string) => void;
}

const InfoRow = ({
  label,
  value,
  icon: Icon,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  icon?: any;
  className?: string;
}) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
    <span className="text-sm font-medium">{value || "-"}</span>
  </div>
);

export function InvestmentEntryDetailsDialog({
  entry,
  projectId,
  children,
  onDelete,
}: InvestmentEntryDetailsDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <DialogTitle className="text-xl">Investment Details</DialogTitle>
            <Badge
              variant={
                entry.status === "active"
                  ? "default"
                  : entry.status === "completed"
                    ? "secondary"
                    : "outline"
              }
              className="capitalize"
            >
              {entry.status}
            </Badge>
          </div>
          <DialogDescription>
            Detailed view of the investment transaction and performance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Top Summary Card */}
          <div className="p-4 rounded-lg bg-muted/30 border grid grid-cols-2 gap-4">
            <InfoRow
              label="Investment Amount"
              value={formatCurrency(entry.amount)}
              icon={CreditCard}
              className="text-primary"
            />
            <InfoRow
              label="Current Profit/Loss"
              value={
                <span
                  className={
                    (entry.profit_loss || 0) >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }
                >
                  {entry.profit_loss
                    ? formatCurrency(entry.profit_loss)
                    : "0.00"}
                </span>
              }
              icon={TrendingUp}
            />
          </div>

          <Separator />

          {/* Investment Terms */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              Investment Terms
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoRow
                label="Principal"
                value={
                  entry.principal ? formatCurrency(entry.principal) : undefined
                }
              />
              <InfoRow label="Duration" value={entry.duration} />
              <InfoRow
                label="Interest Rate"
                value={
                  entry.interest_rate ? `${entry.interest_rate}%` : undefined
                }
                icon={Percent}
              />
              <InfoRow
                label="Start Date"
                value={
                  entry.investment_date
                    ? format(new Date(entry.investment_date), "PP")
                    : undefined
                }
              />
              <InfoRow
                label="Maturity Date"
                value={
                  entry.maturity_date
                    ? format(new Date(entry.maturity_date), "PP")
                    : undefined
                }
              />
              <InfoRow
                label="Calc. Date"
                value={
                  entry.profit_calculation_date
                    ? format(new Date(entry.profit_calculation_date), "PP")
                    : undefined
                }
              />
            </div>
          </div>

          <Separator />

          {/* Performance Metrics */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Performance Metrics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoRow
                label="Expected Profit"
                value={
                  entry.expected_profit
                    ? formatCurrency(entry.expected_profit)
                    : undefined
                }
              />
              <InfoRow
                label="Profit Received"
                value={
                  entry.profit_received
                    ? formatCurrency(entry.profit_received)
                    : undefined
                }
              />
              <InfoRow
                label="Profit Pending"
                value={
                  entry.profit_pending
                    ? formatCurrency(entry.profit_pending)
                    : undefined
                }
              />
              <InfoRow
                label="Profit Status"
                value={
                  entry.profit_status ? (
                    <Badge variant="outline" className="capitalize text-xs">
                      {entry.profit_status}
                    </Badge>
                  ) : undefined
                }
              />
            </div>
          </div>

          {(entry.remarks || entry.image_url) && <Separator />}

          {/* Additional Info */}
          <div className="grid gap-4">
            {entry.remarks && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Remarks / Notes
                </span>
                <p className="text-sm text-muted-foreground bg-muted/20 p-2 rounded border">
                  {entry.remarks}
                </p>
              </div>
            )}

            {entry.image_url && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full sm:w-auto"
                >
                  <a
                    href={entry.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    View Attachment
                  </a>
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t mt-4">
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setOpen(false);
                  onDelete(entry.id);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}

            <EditInvestmentEntryDialog projectId={projectId} entry={entry}>
              <Button size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
            </EditInvestmentEntryDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

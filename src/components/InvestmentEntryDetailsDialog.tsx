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
              value={formatCurrency(entry.investment_amount || entry.amount || 0)}
              icon={CreditCard}
              className="text-primary"
            />
            <InfoRow
              label="Actual Profit"
              value={
                <span className="text-green-600 dark:text-green-400">
                  {entry.actual_profit
                    ? formatCurrency(entry.actual_profit)
                    : "0.00"}
                </span>
              }
              icon={TrendingUp}
            />
          </div>

          <Separator />

          {/* Order Information */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              Order Information
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoRow
                label="Order No"
                value={entry.order_no}
              />
              <InfoRow
                label="Order Date"
                value={
                  entry.order_date
                    ? format(new Date(entry.order_date), "PP")
                    : undefined
                }
              />
              <InfoRow
                label="Order ID"
                value={entry.order_id}
              />
              <InfoRow
                label="Duration"
                value={entry.duration_months ? `${entry.duration_months} months` : undefined}
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
                label="Completion"
                value={
                  <Badge variant={entry.is_completed ? "default" : "outline"} className="text-xs">
                    {entry.is_completed ? "Completed" : "Pending"}
                  </Badge>
                }
              />
            </div>
          </div>

          <Separator />

          {/* Investment Terms */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Percent className="w-4 h-4 text-primary" />
              Investment Terms
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoRow
                label="ROI Min"
                value={
                  entry.roi_min ? `${entry.roi_min}%` : undefined
                }
                icon={Percent}
              />
              <InfoRow
                label="ROI Max"
                value={
                  entry.roi_max ? `${entry.roi_max}%` : undefined
                }
                icon={Percent}
              />
              <InfoRow
                label="Expected Return"
                value={
                  entry.expected_return
                    ? formatCurrency(entry.expected_return)
                    : undefined
                }
              />
              <InfoRow
                label="Expected Profit"
                value={
                  entry.expected_profit
                    ? formatCurrency(entry.expected_profit)
                    : undefined
                }
              />
              <InfoRow
                label="Return Amount"
                value={
                  entry.return_amount
                    ? formatCurrency(entry.return_amount)
                    : undefined
                }
              />
              <InfoRow
                label="Capital Added"
                value={
                  entry.capital_added
                    ? formatCurrency(entry.capital_added)
                    : undefined
                }
              />
            </div>
          </div>

          <Separator />

          {/* Withdrawal Information */}
          {entry.withdrawal_amount && (
            <>
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Withdrawal Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow
                    label="Withdrawal Amount"
                    value={formatCurrency(entry.withdrawal_amount)}
                  />
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Additional Info */}
          <div className="grid gap-4">
            {entry.notes && (
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">
                  Notes
                </span>
                <p className="text-sm text-muted-foreground bg-muted/20 p-2 rounded border">
                  {entry.notes}
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

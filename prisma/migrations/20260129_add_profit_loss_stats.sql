-- AlterTable
ALTER TABLE "investment_projects" ADD COLUMN "total_profit" DECIMAL(15,2) NOT NULL DEFAULT 0;
ALTER TABLE "investment_projects" ADD COLUMN "total_loss" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- CreateEnum
CREATE TYPE "public"."project_status" AS ENUM ('active', 'completed', 'paused');

-- CreateEnum
CREATE TYPE "public"."entry_status" AS ENUM ('pending', 'active', 'completed', 'withdrawn');

-- CreateTable
CREATE TABLE "public"."investment_projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "total_profit_loss" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "remaining_capital" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_investment" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "public"."project_status" NOT NULL DEFAULT 'active',
    "start_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookId" UUID,

    CONSTRAINT "investment_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."investment_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" TIMESTAMPTZ(6) NOT NULL,
    "platform" TEXT NOT NULL,
    "investment_type" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "status" "public"."entry_status" NOT NULL DEFAULT 'pending',
    "profit_loss" DECIMAL(15,2),
    "withdrawal_date" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investment_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bank_statements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "date" TIMESTAMPTZ(6) NOT NULL,
    "total_capital" DECIMAL(15,2) NOT NULL,
    "total_withdrawal" DECIMAL(15,2) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_statements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."investment_projects" ADD CONSTRAINT "investment_projects_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."books"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."investment_entries" ADD CONSTRAINT "investment_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."investment_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bank_statements" ADD CONSTRAINT "bank_statements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."investment_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

# Financial Hive App

A full-stack financial management SaaS for personal/business finance tracking, collaborative bookkeeping, and investment portfolio management.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL via Supabase + Prisma ORM |
| Auth | Supabase Auth (SSR cookie-based) |
| Server State | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| UI | Shadcn-UI (Radix UI) + Tailwind CSS 3 |
| Icons | Lucide React |
| Charts | Recharts |
| Package Manager | Bun |

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── actions/                # Server Actions (books, transactions, investments…)
│   ├── book/[bookId]/          # Book detail
│   ├── investments/
│   │   ├── platforms/[id]/     # Platform detail (projects grid)
│   │   └── projects/[id]/      # Project detail (entries)
│   ├── login/                  # Auth
│   ├── profile/
│   ├── settings/
│   └── users/
├── components/
│   ├── ui/                     # Shadcn-UI primitives — DO NOT edit
│   └── *.tsx                   # Feature components
├── hooks/                      # React Query custom hooks
├── lib/
│   ├── prisma.ts               # Singleton Prisma client
│   ├── supabase/               # client.ts + server.ts
│   ├── utils.ts                # cn(), formatCurrency(), etc.
│   └── receiptGenerator.ts     # jsPDF receipt export
├── types/                      # Shared TypeScript interfaces
│   ├── book.ts
│   ├── transaction.ts
│   └── investment.ts
└── integrations/supabase/      # Auto-generated Supabase types
```

## Development Commands

```bash
bun dev                  # Start dev server → localhost:3000
bun build                # Production build
bun lint                 # ESLint

# Database
bun run migration:create # New Prisma migration
bun run migration:push   # Push schema (dev only — never prod)
bun run migration:up     # Apply pending migrations
bun run db:seed          # Seed database
bun run reset:db         # ⚠️ Destructive — resets entire DB

# Types
bun run generate-types   # Regenerate Supabase TypeScript types
```

## Key Patterns & Conventions

### Components
- Client components must have `"use client"` at the top
- Use Shadcn-UI from `src/components/ui/` — never modify those files
- Combine classes with `cn()` from `@/lib/utils`
- Names: PascalCase files and exports, e.g. `TransactionCard.tsx`

### Custom Hooks
- Live in `src/hooks/`, named `use*.tsx`
- Use `useQuery` for reads, `useMutation` for writes
- Always call `queryClient.invalidateQueries` after a successful mutation
- Expose loading/error states; don't swallow them

### Server Actions
- Live in `src/app/actions/`, one file per domain
- Must have `"use server"` directive
- Get current user: `createClient()` from `@/lib/supabase/server`
- Access DB: Prisma client from `@/lib/prisma`
- Return a typed result object `{ success, data?, error? }`

### Database / Prisma
- Schema: `prisma/schema.prisma`
- Always create a named migration for any schema change
- Never use `prisma db push` in production
- Key models: `Profile`, `Book`, `BookMember`, `Transaction`, `MonthlyBudget`, `UserSettings`, `Notification`, `InvestmentPlatform`, `InvestmentProject`, `InvestmentEntry`, `BankStatement`

### Styling
- Tailwind only — no CSS modules, no inline styles
- Dark mode via `dark:` variants
- Shadcn color tokens: `bg-background`, `text-foreground`, `text-muted-foreground`, etc.
- Responsive: `md:` breakpoint is the primary desktop breakpoint

### TypeScript
- Path alias: `@/` → `src/`
- All shared types in `src/types/` — import from there, not from component files
- Avoid `any`; use `unknown` or define a proper type

### Forms
- Define Zod schema next to the form component
- Use `react-hook-form` with `zodResolver`
- On submit, call a server action, handle the response, and show a toast

## Environment Variables

See `.env.example`. Required:
- `DATABASE_URL` — Prisma connection string
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Gotchas

- `next.config.ts` sets `typescript.ignoreBuildErrors: true` — catch type errors locally with `tsc --noEmit`
- `TransactionsSection` uses `useVirtualScroll` — don't replace with a plain map on long lists
- Investment ROI/profit calculations happen in-component (no DB computed columns); keep arithmetic consistent with existing formulas
- Supabase types in `src/integrations/supabase/types.ts` are auto-generated — run `bun run generate-types` after any schema change, never edit manually

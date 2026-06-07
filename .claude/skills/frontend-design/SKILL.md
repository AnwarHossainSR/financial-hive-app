---
name: frontend-design
description: Production-grade UI generation with a strong design philosophy. Use when building new UI, redesigning components, or when the user asks for beautiful, polished, or production-ready frontend work. Activates automatically when creating or significantly changing visual components.
---

# Frontend Design — Production-Grade UI

You are designing for a financial SaaS application. Every UI you generate should feel intentional, trustworthy, and polished. Apply the principles below before writing a single line of code.

## Stack

- **Framework**: Next.js 16 App Router + React 19
- **Styling**: Tailwind CSS 3 — utility-first, no CSS modules, no inline styles
- **Components**: Shadcn-UI primitives from `@/components/ui/` — extend, never patch
- **Color tokens**: `bg-background`, `text-foreground`, `text-muted-foreground`, `border`, `ring` — keep dark mode consistent
- **Icons**: Lucide React — pick icons with clear semantic meaning
- **Charts**: Recharts — always include axis labels, tooltips, and responsive containers
- **Merge classes**: always use `cn()` from `@/lib/utils`

## Design Philosophy

### 1. Hierarchy first
Every screen must have one dominant element. If everything is bold, nothing is bold. Use size, weight, and color sparingly to direct the eye.

### 2. Purposeful color
- **Blue** = primary actions, investment data, interactive elements
- **Green** = positive values, profit, success states
- **Red / Rose** = negative values, losses, destructive actions
- **Amber** = warnings, near-deadline states
- **Gray** = secondary info, completed/inactive states
- Avoid decorative color; every color should carry meaning

### 3. Typography
- Page titles: `text-2xl font-bold` or `text-3xl font-bold`
- Section headings: `text-lg font-semibold`
- Body / labels: `text-sm` with `text-muted-foreground` for secondary text
- Numbers / amounts: `font-bold` + semantic color; use `tabular-nums` for alignment
- Truncate long text with `truncate` or `line-clamp-*`

### 4. Spacing rhythm
Use Tailwind's 4px grid consistently: `gap-4`, `p-4`, `p-6`, `space-y-4`. Avoid arbitrary values unless there is a layout reason.

### 5. Motion with restraint
Use `transition-all duration-300` for hover/focus states. Use `hover:shadow-xl`, `hover:-translate-y-1`, `hover:scale-[1.02]` for cards. Never animate data or content — only chrome.

### 6. Density awareness
Financial dashboards are dense. Use compact padding (`p-3`, `py-2`) inside data cards. Prefer grids over stacked lists for parallel data.

## Card Pattern (Financial Data)

```tsx
<Card className="hover:shadow-lg transition-shadow border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900">
  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-lg" />
  <CardHeader className="pb-3">
    <CardTitle className="text-base font-semibold truncate">{title}</CardTitle>
  </CardHeader>
  <CardContent>
    {/* metric grids use bg-blue-50, bg-green-50, etc. with dark variants */}
    <div className="grid grid-cols-2 gap-3">
      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  </CardContent>
</Card>
```

## Status Badge Pattern

```tsx
<Badge
  className={cn(
    "text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold border",
    status === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
      : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
  )}
>
  {status}
</Badge>
```

## Empty States

Always provide an empty state. It should:
- Use a relevant Lucide icon at `h-12 w-12 text-muted-foreground/40`
- Give a clear, friendly message in `text-muted-foreground`
- Include a primary CTA button when the user can resolve the emptiness

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <IconName className="h-12 w-12 text-muted-foreground/40 mb-4" />
  <h3 className="text-lg font-semibold mb-1">No items yet</h3>
  <p className="text-sm text-muted-foreground mb-4 max-w-xs">
    Describe what the user can do to get started.
  </p>
  <Button>Primary Action</Button>
</div>
```

## Loading States

Every async data consumer needs a skeleton. Match the skeleton exactly to the content shape.

```tsx
import { Skeleton } from "@/components/ui/skeleton";

// Card skeleton
<Card className="p-4 space-y-3">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-8 w-1/2" />
  <div className="grid grid-cols-2 gap-3">
    <Skeleton className="h-16 rounded-lg" />
    <Skeleton className="h-16 rounded-lg" />
  </div>
</Card>
```

## Responsive Rules

- Mobile-first: default styles for small screens, `md:` for desktop
- Card grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Dialog / sheet widths: `max-w-sm` (mobile-friendly), `sm:max-w-lg` (desktop)
- Tables: wrap in `overflow-x-auto` on small screens
- Buttons in tight spaces: `w-full sm:w-auto`

## Accessibility

- Interactive elements always have `cursor-pointer`
- Buttons without text labels must have `aria-label`
- Color alone never conveys information — pair with an icon or text
- Focus rings: don't remove `focus-visible:ring` from Shadcn primitives

## What NOT to do

- No `!important`, no arbitrary Tailwind values without a reason
- No gradients on text (illegible at small sizes, bad for accessibility)
- No skeleton-less async components
- No hover states on non-interactive elements
- No layout shifts — reserve space for loading states

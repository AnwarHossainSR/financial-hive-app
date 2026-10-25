import { BrandMark } from "@/components/shell/BrandMark";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl"
      />
      <Link href="/" className="relative mb-12">
        <BrandMark withName />
      </Link>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border bg-card text-primary shadow-card">
        <Compass className="h-7 w-7" />
      </span>
      <p className="relative mt-6 text-sm font-semibold uppercase tracking-wider text-primary">
        Error 404
      </p>
      <h1 className="relative mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        This page took a wrong turn
      </h1>
      <p className="relative mt-3 max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved. Your
        books are safe — let&apos;s get you back to them.
      </p>
      <Button asChild className="relative mt-8 gap-2 rounded-xl shadow-primary">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>
    </div>
  );
}

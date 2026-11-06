import type { Reads } from "@/lib/reads";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  // Loaded per request, not at module scope: `next build` imports this file to
  // collect route config, and the reads pull in the database client, which
  // needs DATABASE_URL.
  const { READS } = await import("@/lib/reads");

  const { name } = await params;
  if (!Object.hasOwn(READS, name)) {
    return NextResponse.json({ error: "Unknown read" }, { status: 404 });
  }

  const args: unknown = await request.json().catch(() => null);
  if (!Array.isArray(args)) {
    return NextResponse.json({ error: "Invalid arguments" }, { status: 400 });
  }

  // Each read authenticates from the session cookie itself
  const read = READS[name as keyof Reads] as (
    ...args: unknown[]
  ) => Promise<unknown>;
  return NextResponse.json(await read(...args), {
    headers: { "Cache-Control": "private, no-store" },
  });
}

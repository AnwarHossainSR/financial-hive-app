import type { Reads } from "@/lib/reads";

/**
 * Calls a read from src/lib/reads.ts over /api/read. Unlike Server Actions,
 * several of these can be in flight at once, so a page's queries load in
 * parallel. Same arguments and result as calling the function directly.
 */
export async function read<K extends keyof Reads>(
  name: K,
  ...args: Parameters<Reads[K]>
): Promise<Awaited<ReturnType<Reads[K]>>> {
  const response = await fetch(`/api/read/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!response.ok) {
    throw new Error(`Couldn't load data (${response.status})`);
  }
  return response.json();
}

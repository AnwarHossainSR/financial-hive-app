import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

// Server actions are public HTTP endpoints: anyone can call them with any
// arguments. Identity therefore always comes from the session cookie, never
// from a userId (or isAdmin flag) passed in by the client.

export interface SessionUser {
  id: string;
  email?: string;
}

/**
 * The signed-in user from the session cookie's JWT. Memoised per request.
 *
 * getClaims() checks the token's signature locally against the project's
 * published signing keys — no network call — once the Supabase project uses
 * asymmetric JWT keys. With the legacy shared secret it falls back to asking
 * Supabase Auth, same as getUser().
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub, email: data.claims.email };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

export async function requireUserId(): Promise<string> {
  return (await requireUser()).id;
}

export async function requireAdmin(): Promise<string> {
  const userId = await requireUserId();
  const profile = await prisma.profile.findUnique({
    where: { user_id: userId },
    select: { role: true },
  });
  if (profile?.role !== "admin") throw new Error("Admin access required");
  return userId;
}

/**
 * Throws unless the ownership query matched. Reports "not found" rather than
 * "forbidden" so callers can't probe which ids exist.
 */
export async function assertFound(count: Promise<number>, what: string) {
  if ((await count) === 0) throw new Error(`${what} not found`);
}

export const assertOwnsBook = (userId: string, bookId: string) =>
  assertFound(
    prisma.book.count({ where: { id: bookId, owner_id: userId } }),
    "Book",
  );

export const assertOwnsPlatform = (userId: string, platformId: string) =>
  assertFound(
    prisma.investmentPlatform.count({
      where: { id: platformId, user_id: userId },
    }),
    "Platform",
  );

export const assertOwnsProject = (userId: string, projectId: string) =>
  assertFound(
    prisma.investmentProject.count({
      where: { id: projectId, user_id: userId },
    }),
    "Project",
  );

/** Drops fields a client must never set directly through a spread of its data */
export function stripOwnership<T extends Record<string, any>>(
  data: T,
): // Untyped (`any`) client payloads stay `any`, matching the old `...data`
0 extends 1 & T ? any : Omit<T, "id" | "user_id" | "owner_id" | "created_at"> {
  const {
    id: _id,
    user_id: _userId,
    owner_id: _ownerId,
    created_at: _createdAt,
    ...rest
  } = data ?? {};
  return rest;
}

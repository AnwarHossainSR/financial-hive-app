"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * The proxy already sends signed-in users from "/" to the dashboard, but a
 * session can also be created client-side right here (e.g. arriving from an
 * email-confirmation link), so follow up once it exists.
 */
export function SignedInRedirect() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  return null;
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: any) {
        cookiesToSet.forEach(({ name, value }: any) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }: any) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake can make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  const { pathname } = request.nextUrl;
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  // 1. Auth Guard: send signed-out users to /login, then back where they were
  if (!user) {
    const isPublicRoute =
      isAuthPage || pathname.startsWith("/auth") || pathname === "/";

    if (!isPublicRoute) {
      url.pathname = "/login";
      url.search = `?redirect=${encodeURIComponent(pathname + request.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }
  } else if (isAuthPage || pathname === "/") {
    // Signed-in users skip the landing and auth pages. Honour a same-site
    // ?redirect= so deep links still land where they pointed.
    const target = request.nextUrl.searchParams.get("redirect");
    const safeTarget =
      target?.startsWith("/") && !target.startsWith("//") ? target : null;
    return NextResponse.redirect(
      new URL(safeTarget ?? "/dashboard", request.url),
    );
  }

  return supabaseResponse;
}

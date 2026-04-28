import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Gate /admin/*, /setup/*, and /api/admin/* on the configured ADMIN_EMAIL.
// Anonymous (or wrong-email) users get redirected to /login (or 401 for API).
//
// We read env vars directly here — middleware runs in the Edge runtime,
// where lib/env.ts (server-only + zod parse at import) would fail.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

  if (!supabaseUrl || !supabaseAnonKey || !adminEmail) {
    // Fail closed: if config is missing, nobody gets in.
    return denyOrRedirect(req, pathname);
  }

  const res = NextResponse.next({ request: req });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(toSet) {
        for (const { name, value, options } of toSet) {
          res.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email?.toLowerCase() !== adminEmail) {
    return denyOrRedirect(req, pathname);
  }

  return res;
}

function denyOrRedirect(req: NextRequest, pathname: string): NextResponse {
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const loginUrl = new URL("/login", req.url);
  if (pathname !== "/login") loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/setup/:path*", "/api/admin/:path*"],
};

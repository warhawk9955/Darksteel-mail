import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

// Cookie-bound Supabase client for server components and route handlers.
// Reads/writes the auth session via Next's cookies API.
export async function getServerSupabase(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  return createServerClient<Database>(env.supabase.url, env.supabase.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. Middleware already
          // refreshes the session, so swallowing here is safe.
        }
      },
    },
  });
}

// Returns the authenticated user iff their email matches ADMIN_EMAIL.
// Email comparison is case-insensitive.
export async function getAdminUser(): Promise<User | null> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  if (data.user.email?.toLowerCase() !== env.admin.email) return null;
  return data.user;
}

export async function requireAdminUser(): Promise<User> {
  const user = await getAdminUser();
  if (!user) throw unauthorized();
  return user;
}

function unauthorized(): Response {
  return new Response("Unauthorized", { status: 401 });
}

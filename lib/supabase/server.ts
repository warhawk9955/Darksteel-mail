import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "./types";

// Service-role client. Bypasses RLS. Use for all server-side writes.
// Never import this file from a client component — "server-only" ensures
// a build error if anyone tries.

let cached: SupabaseClient<Database> | null = null;

export function serviceClient(): SupabaseClient<Database> {
  if (cached) return cached;
  cached = createClient<Database>(
    env.supabase.url,
    env.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
  return cached;
}

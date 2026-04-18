import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Anon client. Used from server components for public reads so that we
// exercise the same RLS the browser would hit. NEXT_PUBLIC_* vars are
// embedded at build time.
//
// This file does NOT import "server-only" — we want it usable wherever.
// We do not import lib/env here because that's server-only; we read
// NEXT_PUBLIC_* directly so this module works client-side too if needed.

function readPublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return { url, anonKey };
}

let cached: SupabaseClient<Database> | null = null;

export function anonClient(): SupabaseClient<Database> {
  if (cached) return cached;
  const { url, anonKey } = readPublicEnv();
  cached = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cached;
}

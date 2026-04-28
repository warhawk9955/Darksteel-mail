import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth/admin";
import { serviceClient } from "@/lib/supabase/server";
import { setLaunched } from "@/lib/db/site_config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const config = await setLaunched(serviceClient());
    return NextResponse.json({ config });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "db_error";
    return NextResponse.json({ error: "db_error", message: msg }, { status: 500 });
  }
}

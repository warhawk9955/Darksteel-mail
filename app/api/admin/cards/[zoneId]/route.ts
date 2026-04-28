import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/auth/admin";
import { serviceClient } from "@/lib/supabase/server";
import {
  applyLayoutToZone,
  getCardForZone,
  updateSlotPrices,
} from "@/lib/db/cards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ zoneId: string }>;
}

const Schema = z.object({
  card_layout_id: z.string().uuid().optional(),
  slot_prices: z
    .array(
      z.object({
        spot_id: z.string().uuid(),
        founding_price_cents: z.number().int().min(0).max(10_000_000),
        regular_price_cents: z.number().int().min(0).max(10_000_000),
      }),
    )
    .optional(),
});

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { zoneId } = await ctx.params;
  const card = await getCardForZone(serviceClient(), zoneId);
  if (!card) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ card });
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { zoneId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const svc = serviceClient();

  if (parsed.data.card_layout_id) {
    const result = await applyLayoutToZone(svc, zoneId, parsed.data.card_layout_id);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason },
        { status: 409 },
      );
    }
  }

  if (parsed.data.slot_prices && parsed.data.slot_prices.length > 0) {
    try {
      await updateSlotPrices(svc, zoneId, parsed.data.slot_prices);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "db_error";
      return NextResponse.json({ error: "db_error", message: msg }, { status: 500 });
    }
  }

  const card = await getCardForZone(svc, zoneId);
  return NextResponse.json({ card });
}

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/auth/admin";
import { serviceClient } from "@/lib/supabase/server";
import { upsertSiteConfig, getPublicSiteConfig } from "@/lib/db/site_config";
import { fontPairingSlugIsValid, paletteSlugIsValid } from "@/lib/themes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Schema = z
  .object({
    business_name: z.string().min(1).max(120).optional(),
    tagline: z.string().max(240).nullable().optional(),

    city: z.string().max(120).nullable().optional(),
    state: z.string().max(40).nullable().optional(),
    household_count: z.number().int().min(0).max(10_000_000).nullable().optional(),
    ad_spot_count_default: z.number().int().min(0).max(64).nullable().optional(),
    card_size_inches: z.string().max(20).nullable().optional(),
    mailing_zip_codes: z.array(z.string().regex(/^\d{5}(-\d{4})?$/)).optional(),
    reservation_deadline: z.string().datetime().nullable().optional(),

    contact_email: z.string().email().nullable().optional(),
    contact_phone: z.string().max(40).nullable().optional(),
    show_email_on_site: z.boolean().optional(),
    show_phone_on_site: z.boolean().optional(),
    social_links: z.record(z.string(), z.string().url()).optional(),

    theme_palette: z.string().refine(paletteSlugIsValid, {
      message: "unknown palette",
    }).optional(),
    theme_font_pairing: z.string().refine(fontPairingSlugIsValid, {
      message: "unknown font pairing",
    }).optional(),

    logo_url: z.string().url().nullable().optional(),
    hero_bg_kind: z.enum(["gradient", "stock", "upload"]).optional(),
    hero_bg_url: z.string().url().nullable().optional(),
    portrait_url: z.string().url().nullable().optional(),
    favicon_url: z.string().url().nullable().optional(),
  })
  .strict();

export async function GET(): Promise<Response> {
  const user = await getAdminUser();
  if (!user) return unauthorized();
  const config = await getPublicSiteConfig(serviceClient());
  return NextResponse.json({ config });
}

export async function POST(req: NextRequest): Promise<Response> {
  const user = await getAdminUser();
  if (!user) return unauthorized();

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

  try {
    const config = await upsertSiteConfig(serviceClient(), parsed.data);
    return NextResponse.json({ config });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "db_error";
    return NextResponse.json({ error: "db_error", message: msg }, { status: 500 });
  }
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

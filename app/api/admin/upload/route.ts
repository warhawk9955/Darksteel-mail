import { NextResponse, type NextRequest } from "next/server";
import { getAdminUser } from "@/lib/auth/admin";
import { serviceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_BUCKETS = new Set(["branding", "hero"]);
const ALLOWED_KINDS = new Set(["logo", "portrait", "favicon", "hero"]);
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = form.get("file");
  const kind = String(form.get("kind") ?? "");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (!ALLOWED_KINDS.has(kind)) {
    return NextResponse.json({ error: "bad_kind" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "bad_mime", got: file.type }, { status: 415 });
  }

  const bucket = kind === "hero" ? "hero" : "branding";
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "bad_bucket" }, { status: 400 });
  }

  const ext = mimeExtension(file.type);
  const path = `${kind}/${Date.now()}-${cryptoSlug()}.${ext}`;

  const supabase = serviceClient();
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (upErr) {
    return NextResponse.json(
      { error: "storage_error", message: upErr.message },
      { status: 500 },
    );
  }

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: pub.publicUrl, path, bucket });
}

function mimeExtension(mime: string): string {
  switch (mime) {
    case "image/png": return "png";
    case "image/jpeg": return "jpg";
    case "image/webp": return "webp";
    case "image/svg+xml": return "svg";
    case "image/x-icon":
    case "image/vnd.microsoft.icon":
      return "ico";
    default: return "bin";
  }
}

function cryptoSlug(): string {
  // 8-char base36 from secure randomness, no deps.
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 10);
}

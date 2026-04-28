import type { SiteConfigUpsert } from "@/lib/db/site_config";

// Client-side helper. Calls /api/admin/site (admin-gated by middleware
// + the route's own getAdminUser). Returns the new config or throws.
export async function saveSite(patch: SiteConfigUpsert) {
  const res = await fetch("/api/admin/site", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    let message = `save failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error) message = body.message ?? body.error;
    } catch {
      // ignore parse error; surface the status code
    }
    throw new Error(message);
  }
  return (await res.json()) as { config: unknown };
}

export async function uploadAsset(file: File, kind: "logo" | "hero" | "portrait" | "favicon") {
  const form = new FormData();
  form.set("file", file);
  form.set("kind", kind);
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(body.message ?? body.error ?? `upload failed (${res.status})`);
  }
  return (await res.json()) as { url: string; path: string; bucket: string };
}

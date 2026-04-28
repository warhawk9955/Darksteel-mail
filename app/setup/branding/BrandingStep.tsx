"use client";

import { useState } from "react";
import StepShell from "../_components/StepShell";
import { uploadAsset } from "../_lib/saveSite";
import type { SiteConfigPublic, SiteConfigUpsert } from "@/lib/db/site_config";

type Kind = "logo" | "hero" | "portrait" | "favicon";

export default function BrandingStep({ initial }: { initial: SiteConfigPublic }) {
  const [logoUrl, setLogoUrl] = useState(initial.logo_url ?? "");
  const [heroBgKind, setHeroBgKind] = useState<SiteConfigPublic["hero_bg_kind"]>(
    initial.hero_bg_kind,
  );
  const [heroBgUrl, setHeroBgUrl] = useState(initial.hero_bg_url ?? "");
  const [portraitUrl, setPortraitUrl] = useState(initial.portrait_url ?? "");
  const [faviconUrl, setFaviconUrl] = useState(initial.favicon_url ?? "");
  const [busy, setBusy] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const draft: SiteConfigPublic = {
    ...initial,
    logo_url: logoUrl || null,
    hero_bg_kind: heroBgKind,
    hero_bg_url: heroBgUrl || null,
    portrait_url: portraitUrl || null,
    favicon_url: faviconUrl || null,
  };

  const toPatch = (): SiteConfigUpsert => ({
    logo_url: logoUrl || null,
    hero_bg_kind: heroBgKind,
    hero_bg_url: heroBgUrl || null,
    portrait_url: portraitUrl || null,
    favicon_url: faviconUrl || null,
  });

  async function handleUpload(kind: Kind, file: File | null) {
    if (!file) return;
    setBusy(kind);
    setError(null);
    try {
      const { url } = await uploadAsset(file, kind);
      switch (kind) {
        case "logo":     setLogoUrl(url); break;
        case "hero":     setHeroBgUrl(url); setHeroBgKind("upload"); break;
        case "portrait": setPortraitUrl(url); break;
        case "favicon":  setFaviconUrl(url); break;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "upload failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <StepShell
      step="branding"
      title="Upload your branding"
      subtitle="Add your logo, hero image, portrait, and favicon. All uploads are optional — you can add or change them later from the dashboard."
      draft={draft}
      toPatch={toPatch}
    >
      {error ? (
        <div className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-red">
          {error}
        </div>
      ) : null}

      <UploadField
        label="Logo (optional)"
        helper="Appears in the header and footer. PNG / JPG / SVG · max 5MB."
        currentUrl={logoUrl}
        busy={busy === "logo"}
        onClear={() => setLogoUrl("")}
        onPick={(f) => handleUpload("logo", f)}
      />

      <section>
        <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-text-dim mb-3">
          Hero background (optional)
        </div>
        <div className="flex gap-1 mb-3">
          {(["gradient","upload"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setHeroBgKind(k);
                if (k === "gradient") setHeroBgUrl("");
              }}
              className={`px-4 py-2 font-mono text-[0.7rem] tracking-[0.15em] uppercase border-b-2 transition ${
                heroBgKind === k
                  ? "border-blue text-white"
                  : "border-transparent text-text-dim hover:text-white"
              }`}
            >
              {k === "gradient" ? "Default gradient" : "Upload your own"}
            </button>
          ))}
        </div>
        {heroBgKind === "upload" ? (
          <UploadField
            label=""
            currentUrl={heroBgUrl}
            busy={busy === "hero"}
            onClear={() => { setHeroBgUrl(""); setHeroBgKind("gradient"); }}
            onPick={(f) => handleUpload("hero", f)}
          />
        ) : (
          <div className="bg-panel border border-border p-6 text-center">
            <div className="font-body text-sm text-text-dim">
              Using the palette gradient as the hero background.
            </div>
          </div>
        )}
      </section>

      <UploadField
        label="Portrait photo (optional)"
        helper="A personal photo for the About section. Builds trust with prospects."
        currentUrl={portraitUrl}
        busy={busy === "portrait"}
        onClear={() => setPortraitUrl("")}
        onPick={(f) => handleUpload("portrait", f)}
      />

      <UploadField
        label="Site favicon (optional)"
        helper="Appears in browser tabs. Square image (32×32 or larger) recommended."
        currentUrl={faviconUrl}
        busy={busy === "favicon"}
        onClear={() => setFaviconUrl("")}
        onPick={(f) => handleUpload("favicon", f)}
      />
    </StepShell>
  );
}

function UploadField({
  label,
  helper,
  currentUrl,
  busy,
  onClear,
  onPick,
}: {
  label: string;
  helper?: string;
  currentUrl: string;
  busy: boolean;
  onClear: () => void;
  onPick: (f: File) => void;
}) {
  if (currentUrl) {
    return (
      <section>
        {label ? (
          <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-text-dim mb-2">
            {label}
          </div>
        ) : null}
        <div className="bg-panel border border-border p-4 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentUrl} alt="" className="w-12 h-12 object-cover bg-panel-2" />
          <span className="flex-1 font-body text-sm text-text-dim truncate">Uploaded</span>
          <button
            type="button"
            onClick={onClear}
            className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-text-dim hover:text-red transition"
          >
            ✕ Remove
          </button>
        </div>
        {helper ? (
          <p className="font-body text-xs text-text-faint mt-2">{helper}</p>
        ) : null}
      </section>
    );
  }
  return (
    <section>
      {label ? (
        <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-text-dim mb-2">
          {label}
        </div>
      ) : null}
      <label className="block bg-panel border border-dashed border-border hover:border-blue transition p-8 text-center cursor-pointer">
        <input
          type="file"
          className="hidden"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
          }}
          disabled={busy}
        />
        <div className="font-body text-sm text-text-dim">
          {busy ? "Uploading…" : "Click to upload"}
        </div>
        <div className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-text-faint mt-1">
          PNG · JPG · WEBP · SVG — max 5MB
        </div>
      </label>
      {helper ? (
        <p className="font-body text-xs text-text-faint mt-2">{helper}</p>
      ) : null}
    </section>
  );
}

"use client";

import type { SiteConfigPublic } from "@/lib/db/site_config";

// Compact, scaled-down homepage preview that updates as the user edits.
// Mirrors the structure of app/page.tsx but stripped to the key
// recolorable surfaces. Uses inline data-palette to swap colors
// independently of the main <html data-palette>.
export default function LivePreview({ config }: { config: SiteConfigPublic }) {
  const place = [config.city, config.state].filter(Boolean).join(", ");
  const heroBg: React.CSSProperties =
    config.hero_bg_kind !== "gradient" && config.hero_bg_url
      ? {
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.65)), url(${config.hero_bg_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {
          backgroundImage:
            "linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-primary) 100%)",
        };

  return (
    <div
      data-palette={config.theme_palette}
      className="rounded-md overflow-hidden border border-border shadow-2xl"
    >
      <div className="bg-bg border-b border-border px-3 py-2 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red" />
        <span className="w-2 h-2 rounded-full bg-amber" />
        <span className="w-2 h-2 rounded-full bg-teal" />
        <span className="ml-2 font-mono text-[0.6rem] tracking-[0.15em] uppercase text-text-faint truncate">
          sites.darksteelmail.com
        </span>
      </div>

      <div className="bg-theme-surface text-theme-on-surface">
        <header className="border-b border-theme-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              {config.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={config.logo_url}
                  alt=""
                  className="h-4 w-auto"
                />
              ) : (
                <span
                  className="w-3 h-3 rotate-45 inline-block"
                  style={{ background: "var(--theme-primary)" }}
                />
              )}
              <span className="font-display text-xs tracking-[0.1em]">
                {config.business_name || "Your Business"}
              </span>
            </span>
            <span
              className="font-body text-[0.55rem] uppercase tracking-wide px-2 py-1"
              style={{
                background: "var(--theme-primary)",
                color: "var(--theme-primary-on)",
              }}
            >
              Reserve Spot
            </span>
          </div>
        </header>

        <section style={heroBg} className="px-4 py-8">
          <div
            className="w-1 h-6 mb-3"
            style={{ background: "var(--theme-primary)" }}
          />
          <div
            className="font-display text-lg leading-tight tracking-[0.02em] mb-2"
            style={{ color: "var(--theme-primary-on)" }}
          >
            {config.business_name || "Your Business Name"}
          </div>
          <div
            className="font-body text-[0.65rem] mb-3 max-w-[16rem]"
            style={{ color: "var(--theme-primary-on)", opacity: 0.85 }}
          >
            {config.tagline || "Your tagline will appear here"}
          </div>
          <span
            className="inline-block font-body text-[0.55rem] uppercase tracking-wide px-3 py-1.5"
            style={{
              background: "var(--theme-primary)",
              color: "var(--theme-primary-on)",
            }}
          >
            Reserve Your Spot →
          </span>
        </section>

        <section
          className="border-y border-theme-border"
          style={{ background: "var(--theme-accent)" }}
        >
          <div className="px-4 py-4 grid grid-cols-3 gap-2">
            <PreviewStat label="Serving" value={place || "—"} />
            <PreviewStat
              label="Households"
              value={(config.household_count ?? 0).toLocaleString()}
            />
            <PreviewStat
              label="Ad Spots"
              value={String(config.ad_spot_count_default ?? 0)}
            />
          </div>
        </section>

        <section className="bg-theme-surface-2 px-4 py-5">
          <div className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-theme-on-surface-dim mb-2 text-center">
            Why local businesses love this
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["Targeted", "Affordable", "Exclusive"].map((t) => (
              <div
                key={t}
                className="border border-theme-border bg-theme-surface p-2"
              >
                <div
                  className="w-3 h-3 rotate-45 mb-1"
                  style={{ background: "var(--theme-primary)" }}
                />
                <div className="font-display text-[0.6rem] tracking-[0.04em]">
                  {t}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="bg-theme-surface-2 border-t border-theme-border px-4 py-3">
          <div className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-theme-on-surface-dim">
            © {config.business_name || "Your Business"}
            {config.show_email_on_site && config.contact_email
              ? ` · ${config.contact_email}`
              : ""}
          </div>
        </footer>
      </div>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div
        className="font-display text-sm tracking-[0.04em]"
        style={{ color: "var(--theme-primary-on)" }}
      >
        {value}
      </div>
      <div
        className="font-mono text-[0.5rem] tracking-[0.15em] uppercase"
        style={{ color: "var(--theme-primary-on)", opacity: 0.7 }}
      >
        {label}
      </div>
    </div>
  );
}

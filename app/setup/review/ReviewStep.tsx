"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { SiteConfigPublic } from "@/lib/db/site_config";
import type { CardSummary } from "@/lib/db/cards";
import { PALETTES } from "@/lib/themes";
import { prevStep } from "../_lib/steps";

interface Props {
  config: SiteConfigPublic;
  card: CardSummary | null;
}

export default function ReviewStep({ config, card }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const back = prevStep("review");

  const isLaunched = Boolean(config.launched_at);
  const palette = PALETTES.find((p) => p.slug === config.theme_palette);

  function launch() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/launch", { method: "POST" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `launch failed (${res.status})`);
        }
        router.push("/admin");
      } catch (e) {
        setError(e instanceof Error ? e.message : "launch failed");
      }
    });
  }

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10">
      <h1 className="font-display text-3xl sm:text-4xl tracking-[0.04em] mb-3">
        Review &amp; launch
      </h1>
      <p className="font-body text-text-dim mb-10 max-w-2xl leading-relaxed">
        Last sanity check before going live. Anything you want to change goes
        through the same wizard steps from <Link href="/admin" className="text-blue hover:underline">/admin</Link>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <Card title="Name" editHref="/setup/name">
          <Row label="Business" value={config.business_name} />
          <Row label="Tagline"  value={config.tagline ?? "—"} />
        </Card>

        <Card title="Campaign" editHref="/setup/campaign">
          <Row label="Place"       value={[config.city, config.state].filter(Boolean).join(", ") || "—"} />
          <Row label="Households"  value={(config.household_count ?? 0).toLocaleString()} />
          <Row label="Ad spots"    value={String(config.ad_spot_count_default ?? 0)} />
          <Row label="Card size"   value={config.card_size_inches ?? "—"} />
          <Row label="ZIPs"        value={config.mailing_zip_codes.join(", ") || "—"} />
          <Row label="Deadline"    value={config.reservation_deadline ? new Date(config.reservation_deadline).toLocaleString() : "—"} />
        </Card>

        <Card title="Contact" editHref="/setup/contact">
          <Row label="Email"     value={config.contact_email ?? "—"} />
          <Row label="Phone"     value={config.contact_phone ?? "—"} />
          <Row label="Show email" value={config.show_email_on_site ? "yes" : "no"} />
          <Row label="Show phone" value={config.show_phone_on_site ? "yes" : "no"} />
        </Card>

        <Card title="Look" editHref="/setup/look">
          <Row label="Palette"     value={palette?.name ?? config.theme_palette} />
          <Row label="Font pairing" value={config.theme_font_pairing} />
          {palette ? (
            <div className="flex gap-1 mt-2">
              {palette.swatches.map((c, i) => (
                <span key={i} className="w-6 h-6 rounded-sm" style={{ background: c }} />
              ))}
            </div>
          ) : null}
        </Card>

        <Card title="Branding" editHref="/setup/branding">
          <Row label="Logo"      value={config.logo_url     ? "uploaded" : "—"} />
          <Row label="Hero"      value={config.hero_bg_kind === "gradient" ? "default gradient" : config.hero_bg_url ? "uploaded" : "—"} />
          <Row label="Portrait"  value={config.portrait_url ? "uploaded" : "—"} />
          <Row label="Favicon"   value={config.favicon_url  ? "uploaded" : "—"} />
        </Card>

        <Card title="Card" editHref="/setup/card">
          {card ? (
            <>
              <Row label="Zone"     value={card.zone_name} />
              <Row label="Layout"   value={card.layout_name ?? "—"} />
              <Row label="Slots"    value={String(card.spots.length)} />
              <Row
                label="Price range"
                value={priceRangeLabel(card)}
              />
            </>
          ) : (
            <Row label="Card" value="No zone yet" />
          )}
        </Card>
      </div>

      {error ? (
        <div className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-red mb-4">
          {error}
        </div>
      ) : null}

      <div className="bg-panel border border-blue p-6">
        <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-blue mb-3">
          {isLaunched ? "Already launched" : "Ready to launch"}
        </div>
        <h2 className="font-display text-2xl tracking-[0.04em] mb-3">
          {isLaunched
            ? "Your site is live"
            : "Flip the switch and your site is live."}
        </h2>
        <p className="font-body text-text-dim mb-5 leading-relaxed">
          {isLaunched
            ? `Launched ${new Date(config.launched_at!).toLocaleString()}. Edits from /admin take effect immediately.`
            : "Launching sets the launched_at timestamp on site_config and clears the pre-launch banner from the public homepage. You can keep editing from /admin afterward — there's no rollback step needed."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {!isLaunched ? (
            <button
              type="button"
              onClick={launch}
              disabled={pending}
              className="bg-blue text-bg font-body font-bold text-sm uppercase tracking-wide px-7 py-3 hover:shadow-blue-glow hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
            >
              {pending ? "Launching…" : "Launch site →"}
            </button>
          ) : null}
          <Link
            href="/"
            target="_blank"
            className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-text-dim hover:text-blue transition"
          >
            View live site ↗
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between mt-10">
        {back ? (
          <Link
            href={back}
            className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-text-dim hover:text-white transition inline-flex items-center gap-2"
          >
            <span aria-hidden>←</span> Back
          </Link>
        ) : <span />}
        <Link
          href="/admin"
          className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-text-dim hover:text-white transition"
        >
          Skip to dashboard →
        </Link>
      </div>
    </div>
  );
}

function Card({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-panel border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-text-dim">
          {title}
        </div>
        <Link
          href={editHref}
          className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-blue hover:underline"
        >
          Edit
        </Link>
      </div>
      <dl className="flex flex-col gap-1">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-border last:border-b-0">
      <dt className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-text-faint shrink-0">
        {label}
      </dt>
      <dd className="font-body text-sm text-white text-right truncate">
        {value}
      </dd>
    </div>
  );
}

function priceRangeLabel(card: CardSummary): string {
  const founding = card.spots
    .map((s) => s.founding_price_cents)
    .filter((n): n is number => n != null);
  if (founding.length === 0) return "—";
  const min = Math.min(...founding);
  const max = Math.max(...founding);
  if (min === max) return `$${(min / 100).toLocaleString()}`;
  return `$${(min / 100).toLocaleString()} – $${(max / 100).toLocaleString()}`;
}

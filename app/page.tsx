import Link from "next/link";
import { anonClient } from "@/lib/supabase/anon";
import {
  DEFAULT_SITE_CONFIG,
  getPublicSiteConfig,
  type SiteConfigPublic,
} from "@/lib/db/site_config";
import { listZoneSummaries, type ZoneSummary } from "@/lib/db/zones";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const client = anonClient();
  const [config, zones] = await Promise.all([
    safeGetConfig(client),
    safeListZones(client),
  ]);

  const isPreLaunch = !config.launched_at;

  return (
    <main className="bg-theme-surface text-theme-on-surface min-h-screen">
      {isPreLaunch ? <PreLaunchBanner /> : null}
      <SiteHeader config={config} />
      <Hero config={config} />
      <StatsStrip config={config} zones={zones} />
      <WhyLoveThis />
      <CardLineup zones={zones} config={config} />
      <ContactSection config={config} />
      <SiteFooter config={config} />
    </main>
  );
}

// ----------------------------------------------------------------------

function PreLaunchBanner() {
  return (
    <div
      style={{ background: "var(--theme-accent)", color: "var(--theme-primary-on)" }}
      className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-center py-2"
    >
      Pre-launch preview · finalize in /admin to publish
    </div>
  );
}

function SiteHeader({ config }: { config: SiteConfigPublic }) {
  return (
    <header className="border-b border-theme-border">
      <div className="max-w-[1200px] mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {config.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logo_url} alt={config.business_name} className="h-8 w-auto" />
          ) : (
            <div
              className="w-5 h-5 rotate-45 relative"
              style={{ background: "var(--theme-primary)" }}
            >
              <div
                className="absolute inset-[2px]"
                style={{ background: "var(--theme-surface)" }}
              />
            </div>
          )}
          <span className="font-display text-lg tracking-[0.1em]">
            {config.business_name}
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#about" className="font-body text-sm text-theme-on-surface-dim hover:text-theme-on-surface transition">About</a>
          <a href="#pricing" className="font-body text-sm text-theme-on-surface-dim hover:text-theme-on-surface transition">Pricing</a>
          <a href="#contact" className="font-body text-sm text-theme-on-surface-dim hover:text-theme-on-surface transition">Contact</a>
          <Link
            href="#contact"
            className="font-body font-bold text-sm uppercase tracking-wide px-5 py-2"
            style={{ background: "var(--theme-primary)", color: "var(--theme-primary-on)" }}
          >
            Reserve Spot
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero({ config }: { config: SiteConfigPublic }) {
  const heroBg = heroBackgroundStyle(config);
  return (
    <section className="relative overflow-hidden" style={heroBg}>
      <div className="max-w-[1200px] mx-auto px-6 py-24 sm:py-32">
        <div
          className="w-1 h-12 mb-6"
          style={{ background: "var(--theme-primary)" }}
        />
        <h1
          className="font-display text-[clamp(2.6rem,6vw,5.5rem)] leading-[1] tracking-[0.02em] mb-6 max-w-3xl"
          style={{ color: "var(--theme-primary-on)" }}
        >
          {config.business_name}
        </h1>
        {config.tagline ? (
          <p
            className="font-body text-lg sm:text-xl mb-10 max-w-2xl leading-relaxed"
            style={{ color: "var(--theme-primary-on)", opacity: 0.85 }}
          >
            {config.tagline}
          </p>
        ) : null}
        <Link
          href="#contact"
          className="inline-flex items-center gap-2 font-body font-bold text-sm uppercase tracking-wide px-7 py-4"
          style={{ background: "var(--theme-primary)", color: "var(--theme-primary-on)" }}
        >
          Reserve Your Spot <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}

function heroBackgroundStyle(config: SiteConfigPublic): React.CSSProperties {
  if (config.hero_bg_kind !== "gradient" && config.hero_bg_url) {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.65)), url(${config.hero_bg_url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return {
    backgroundImage:
      "linear-gradient(135deg, var(--theme-accent) 0%, var(--theme-primary) 100%)",
  };
}

function StatsStrip({
  config,
  zones,
}: {
  config: SiteConfigPublic;
  zones: ZoneSummary[];
}) {
  const totalHouseholds =
    zones.reduce((acc, z) => acc + z.household_count, 0) ||
    config.household_count ||
    5000;
  const totalSpots =
    zones.reduce((acc, z) => acc + z.total_spots, 0) ||
    config.ad_spot_count_default ||
    16;
  const place = [config.city, config.state].filter(Boolean).join(", ");

  return (
    <section
      className="border-y border-theme-border"
      style={{ background: "var(--theme-accent)" }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-3 gap-6">
        <Stat label="Serving"     value={place || "Your area"} />
        <Stat label="Households"  value={totalHouseholds.toLocaleString()} />
        <Stat label="Ad spots"    value={String(totalSpots)} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div
        className="font-display text-3xl sm:text-4xl tracking-[0.04em]"
        style={{ color: "var(--theme-primary-on)" }}
      >
        {value}
      </div>
      <div
        className="font-mono text-[0.65rem] tracking-[0.2em] uppercase mt-1"
        style={{ color: "var(--theme-primary-on)", opacity: 0.7 }}
      >
        {label}
      </div>
    </div>
  );
}

function WhyLoveThis() {
  const items = [
    {
      title: "Targeted Reach",
      body: "5,000 verified households per drop via USPS EDDM. No filler routes, no wasted impressions.",
    },
    {
      title: "Affordable Advertising",
      body: "Pennies per door. A fraction of Valpak's CPM, with one curated card instead of an envelope of coupons.",
    },
    {
      title: "Category Exclusivity",
      body: "One business per category, guaranteed. Your competitor never shares the postcard with you.",
    },
  ];
  return (
    <section id="about" className="bg-theme-surface-2">
      <div className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-theme-on-surface-dim mb-3 text-center">
          Why local businesses love this
        </div>
        <h2 className="font-display text-3xl sm:text-4xl tracking-[0.04em] text-center mb-12">
          Curated. Affordable. Effective.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              className="p-6 border border-theme-border bg-theme-surface"
            >
              <div
                className="w-8 h-8 rotate-45 mb-5"
                style={{ background: "var(--theme-primary)" }}
              />
              <h3 className="font-display text-lg tracking-[0.04em] mb-2">
                {item.title}
              </h3>
              <p className="font-body text-sm text-theme-on-surface-dim leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CardLineup({
  zones,
  config,
}: {
  zones: ZoneSummary[];
  config: SiteConfigPublic;
}) {
  if (zones.length === 0) {
    return (
      <section id="pricing" className="bg-theme-surface">
        <div className="max-w-[1200px] mx-auto px-6 py-20 text-center">
          <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-theme-on-surface-dim mb-3">
            See the lineup
          </div>
          <h2 className="font-display text-3xl sm:text-4xl tracking-[0.04em] mb-4">
            No active drops yet
          </h2>
          <p className="font-body text-theme-on-surface-dim max-w-xl mx-auto">
            Operator hasn&rsquo;t published a card yet. Check back soon, or
            ping {config.contact_email ?? "the team"}.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="bg-theme-surface">
      <div className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-theme-on-surface-dim mb-3 text-center">
          See the lineup
        </div>
        <h2 className="font-display text-3xl sm:text-4xl tracking-[0.04em] text-center mb-12">
          Pick your drop. Lock your spot.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <Link
              key={zone.id}
              href={`/zones/${zone.slug}`}
              className="group p-6 border border-theme-border bg-theme-surface-2 hover:border-theme-primary transition"
            >
              <div className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-theme-on-surface-dim mb-3">
                ZIP {zone.zip} · {dropDate(zone.drop_date)}
              </div>
              <h3 className="font-display text-2xl tracking-[0.04em] mb-3">
                {zone.name}
              </h3>
              <p className="font-body text-sm text-theme-on-surface-dim mb-5">
                {zone.household_count.toLocaleString()} households reached.{" "}
                <span style={{ color: "var(--theme-primary)" }}>
                  {zone.available_spots}
                </span>{" "}
                of {zone.total_spots} spots open.
              </p>
              <span
                className="font-mono text-[0.7rem] tracking-[0.15em] uppercase group-hover:underline"
                style={{ color: "var(--theme-primary)" }}
              >
                See spots →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection({ config }: { config: SiteConfigPublic }) {
  return (
    <section
      id="contact"
      style={{ background: "var(--theme-accent)" }}
      className="text-center"
    >
      <div className="max-w-[800px] mx-auto px-6 py-20">
        <div
          className="font-mono text-[0.7rem] tracking-[0.2em] uppercase mb-3"
          style={{ color: "var(--theme-primary-on)", opacity: 0.7 }}
        >
          Reserve your spot
        </div>
        <h2
          className="font-display text-3xl sm:text-4xl tracking-[0.04em] mb-6"
          style={{ color: "var(--theme-primary-on)" }}
        >
          Tell us about your business
        </h2>
        <p
          className="font-body mb-8"
          style={{ color: "var(--theme-primary-on)", opacity: 0.85 }}
        >
          We&rsquo;ll reach out within one business day with availability and
          founding-rate eligibility.
        </p>

        <form
          method="post"
          action="/api/leads"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto"
        >
          <input
            name="business_name"
            required
            placeholder="Business name"
            className="bg-theme-surface text-theme-on-surface px-4 py-3 font-body text-sm border border-theme-border focus:outline-none focus:border-theme-primary"
          />
          <input
            name="contact_email"
            type="email"
            required
            placeholder="you@example.com"
            className="bg-theme-surface text-theme-on-surface px-4 py-3 font-body text-sm border border-theme-border focus:outline-none focus:border-theme-primary"
          />
          <input
            name="phone"
            placeholder="Phone (optional)"
            className="bg-theme-surface text-theme-on-surface px-4 py-3 font-body text-sm border border-theme-border focus:outline-none focus:border-theme-primary sm:col-span-2"
          />
          <textarea
            name="message"
            placeholder="Anything we should know? Category, neighborhood…"
            rows={3}
            className="bg-theme-surface text-theme-on-surface px-4 py-3 font-body text-sm border border-theme-border focus:outline-none focus:border-theme-primary sm:col-span-2"
          />
          <button
            type="submit"
            className="sm:col-span-2 font-body font-bold text-sm uppercase tracking-wide px-7 py-4 mt-2"
            style={{
              background: "var(--theme-primary)",
              color: "var(--theme-primary-on)",
            }}
          >
            Send to operator
          </button>
        </form>
      </div>
    </section>
  );
}

function SiteFooter({ config }: { config: SiteConfigPublic }) {
  const social = Object.entries(config.social_links).filter(([, v]) => Boolean(v));
  return (
    <footer className="bg-theme-surface-2 border-t border-theme-border">
      <div className="max-w-[1200px] mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div>
          <div className="font-display text-lg tracking-[0.1em] mb-2">
            {config.business_name}
          </div>
          {config.tagline ? (
            <p className="font-body text-sm text-theme-on-surface-dim max-w-xs">
              {config.tagline}
            </p>
          ) : null}
        </div>
        <div>
          <div className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-theme-on-surface-dim mb-3">
            Contact
          </div>
          {config.show_email_on_site && config.contact_email ? (
            <a
              href={`mailto:${config.contact_email}`}
              className="font-body text-sm block hover:underline"
            >
              {config.contact_email}
            </a>
          ) : null}
          {config.show_phone_on_site && config.contact_phone ? (
            <a
              href={`tel:${config.contact_phone}`}
              className="font-body text-sm block hover:underline"
            >
              {config.contact_phone}
            </a>
          ) : null}
        </div>
        <div className="md:text-right">
          <div className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-theme-on-surface-dim mb-3">
            Follow
          </div>
          {social.length > 0 ? (
            <div className="flex md:justify-end gap-4">
              {social.map(([k, v]) => (
                <a
                  key={k}
                  href={v}
                  className="font-body text-sm hover:underline"
                  rel="noreferrer"
                  target="_blank"
                >
                  {k}
                </a>
              ))}
            </div>
          ) : (
            <span className="font-body text-sm text-theme-on-surface-dim">
              —
            </span>
          )}
        </div>
      </div>
      <div className="border-t border-theme-border">
        <div className="max-w-[1200px] mx-auto px-6 py-4 font-mono text-[0.65rem] tracking-[0.15em] uppercase text-theme-on-surface-dim">
          © {new Date().getFullYear()} {config.business_name}
        </div>
      </div>
    </footer>
  );
}

function dropDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

async function safeGetConfig(client: ReturnType<typeof anonClient>) {
  try {
    return await getPublicSiteConfig(client);
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

async function safeListZones(client: ReturnType<typeof anonClient>) {
  try {
    return await listZoneSummaries(client);
  } catch {
    return [] as ZoneSummary[];
  }
}

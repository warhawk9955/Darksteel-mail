import { notFound } from "next/navigation";
import Link from "next/link";
import { anonClient } from "@/lib/supabase/anon";
import { getZoneBySlug } from "@/lib/db/zones";
import { getSpotsByZone } from "@/lib/db/spots";
import { computePrice, soldFraction } from "@/lib/pricing";
import PostcardPreview from "./PostcardPreview";
import SpotAvailabilityRow from "./SpotAvailabilityRow";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ZonePage({ params }: PageProps) {
  const { slug } = await params;
  const client = anonClient();

  const zone = await getZoneBySlug(client, slug);
  if (!zone) notFound();

  const spots = await getSpotsByZone(client, zone.id);
  if (spots.length === 0) notFound();

  const fraction = soldFraction(spots);
  const availableCount = spots.filter((s) => s.status === "available").length;
  const standardPrice = computePrice(zone, "standard", fraction);

  const dropDate = new Date(zone.drop_date);
  const dropDateLabel = dropDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const dropDateShort = dropDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <main className="max-w-[1200px] mx-auto px-6 py-12 sm:py-16">
      <Link
        href="/"
        className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-text-dim hover:text-white transition inline-flex items-center gap-2 mb-10"
      >
        <span aria-hidden>←</span> Back
      </Link>

      <div className="font-mono text-[0.75rem] tracking-[0.2em] uppercase text-blue mb-4 inline-flex items-center gap-2">
        <span
          className="w-[6px] h-[6px] bg-blue rounded-full"
          style={{ animation: "pulse 2s ease-in-out infinite" }}
        />
        Zone 1 · {zone.name} · {dropDateLabel}
      </div>

      <h1 className="text-[clamp(2.2rem,5vw,4rem)] leading-[1] mb-6 max-w-3xl">
        Eight local businesses.
        <br />
        One postcard.
        <br />
        {zone.household_count.toLocaleString()} homes.
      </h1>

      <p className="font-body text-text-dim max-w-2xl leading-relaxed mb-10">
        ZIP {zone.zip}. Drops {dropDateShort}. Ten spots total — eight standard
        on the front, two featured on the back. One business per category,
        guaranteed. Founding rate holds until the zone hits 50% sold.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        <Stat
          label="Spots left"
          value={`${availableCount} / ${spots.length}`}
          sub={
            availableCount === 0
              ? "Fully booked"
              : availableCount <= 3
                ? "Closing fast"
                : "Open"
          }
        />
        <Stat
          label="Standard rate"
          value={`$${(standardPrice.amountCents / 100).toLocaleString()}`}
          sub={
            standardPrice.isFoundingRate ? "Founding rate active" : "Regular rate"
          }
        />
        <Stat
          label="Drop date"
          value={dropDateShort}
          sub={`${zone.household_count.toLocaleString()} households · EDDM`}
        />
      </div>

      <section className="mb-16">
        <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-text-dim mb-4">
          Live Availability
        </div>
        <SpotAvailabilityRow
          spots={spots}
          standardFoundingCents={zone.standard_founding_cents}
          standardRegularCents={zone.standard_regular_cents}
          featuredFoundingCents={zone.featured_founding_cents}
          featuredRegularCents={zone.featured_regular_cents}
          isFoundingRate={standardPrice.isFoundingRate}
        />
      </section>

      <section>
        <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-text-dim mb-4">
          Postcard · 6.5&quot; × 11&quot; jumbo
        </div>
        <PostcardPreview
          spots={spots}
          zoneName={zone.name}
          dropDateLabel={dropDateLabel}
          issueNumber="001"
        />
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-panel border border-border p-5">
      <div className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-text-faint mb-2">
        {label}
      </div>
      <div className="font-display text-3xl tracking-[0.04em] uppercase text-white leading-none mb-2">
        {value}
      </div>
      <div className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-text-dim">
        {sub}
      </div>
    </div>
  );
}

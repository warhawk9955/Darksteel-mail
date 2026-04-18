import Link from "next/link";
import { stripe } from "@/lib/stripe/client";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  let session: Stripe.Checkout.Session | null = null;
  if (session_id) {
    try {
      session = await stripe().checkout.sessions.retrieve(session_id);
    } catch {
      // Session id invalid, expired, or from another account — fall through.
    }
  }

  const zoneSlug =
    (session?.metadata?.zone_slug as string | undefined) ?? "tonawanda-east";
  const amountPaid =
    typeof session?.amount_total === "number"
      ? `$${(session.amount_total / 100).toLocaleString()}`
      : null;
  const businessName =
    (session?.customer_details?.name as string | undefined) ??
    (session?.customer_email as string | undefined) ??
    null;
  const isPaid = session?.payment_status === "paid";

  return (
    <main className="max-w-[720px] mx-auto px-6 py-16">
      <div className="font-mono text-[0.75rem] tracking-[0.2em] uppercase text-blue mb-4 inline-flex items-center gap-2">
        <span
          className="w-[6px] h-[6px] bg-blue rounded-full"
          style={{ animation: "pulse 2s ease-in-out infinite" }}
        />
        {isPaid ? "Payment confirmed" : "Payment processing"}
      </div>

      <h1 className="text-[clamp(2.2rem,5vw,3.5rem)] leading-[1] mb-6">
        {isPaid ? "You\u2019re on the postcard." : "Almost there."}
      </h1>

      <p className="font-body text-text-dim leading-relaxed mb-8 max-w-xl">
        {isPaid ? (
          <>
            {amountPaid ? `${amountPaid} received.` : "Payment received."}{" "}
            Receipt is on its way to your inbox. We\u2019ll send proofs two
            weeks before the drop and a final approval one week before.
          </>
        ) : (
          <>
            Stripe is still confirming the charge. This page usually updates
            in a few seconds \u2014 refresh if you don\u2019t see confirmation
            in a minute. Either way, we\u2019ll email you as soon as
            it\u2019s settled.
          </>
        )}
      </p>

      <div className="bg-panel border border-border p-6 mb-8 grid gap-4 sm:grid-cols-2">
        <Fact
          label="Status"
          value={isPaid ? "Paid" : session ? "Processing" : "Unknown"}
        />
        {amountPaid ? <Fact label="Amount" value={amountPaid} /> : null}
        {businessName ? <Fact label="Business" value={businessName} /> : null}
        {session?.metadata?.tier ? (
          <Fact label="Tier" value={String(session.metadata.tier)} />
        ) : null}
      </div>

      <Link
        href={`/zones/${zoneSlug}`}
        className="inline-flex items-center gap-2 bg-blue text-bg font-body font-bold text-sm uppercase tracking-wide px-8 py-4 hover:shadow-blue-glow hover:-translate-y-0.5 transition-all duration-200"
      >
        Back to the zone <span aria-hidden>→</span>
      </Link>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-text-faint mb-1">
        {label}
      </div>
      <div className="font-body text-base text-white truncate">{value}</div>
    </div>
  );
}

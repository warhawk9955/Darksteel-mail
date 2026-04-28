import { serviceClient } from "@/lib/supabase/server";
import { listCardLayouts, getCardForZone } from "@/lib/db/cards";
import { listZoneSummaries } from "@/lib/db/zones";
import WizardStepper from "../_components/WizardStepper";
import CardBuilder from "../_components/CardBuilder";
import { nextStep, prevStep } from "../_lib/steps";

export const dynamic = "force-dynamic";

export default async function CardStepPage() {
  const svc = serviceClient();

  // Single-tenant for now: pick the first zone. Multi-zone management
  // arrives with an explicit /admin/cards picker.
  const layouts = await listCardLayouts(svc);
  const zones = await listZoneSummaries(svc);
  const zoneId = zones[0]?.id;
  if (!zoneId) {
    return (
      <>
        <WizardStepper current="card" />
        <div className="max-w-[800px] mx-auto px-6 py-16">
          <h1 className="font-display text-3xl tracking-[0.04em] mb-4">
            No active card yet
          </h1>
          <p className="font-body text-text-dim">
            Create a zone in the database first, then come back to the card
            builder. (M1 ships a seeded Tonawanda East zone — if you don&rsquo;t
            see it, run <code className="font-mono text-blue">npm run db:reset</code>.)
          </p>
        </div>
      </>
    );
  }

  const card = await getCardForZone(svc, zoneId);
  if (!card) {
    return (
      <>
        <WizardStepper current="card" />
        <div className="max-w-[800px] mx-auto px-6 py-16">
          <h1 className="font-display text-3xl tracking-[0.04em] mb-4">
            Card not found
          </h1>
        </div>
      </>
    );
  }

  return (
    <>
      <WizardStepper current="card" />
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <h1 className="font-display text-3xl sm:text-4xl tracking-[0.04em] mb-3">
          Build your card
        </h1>
        <p className="font-body text-text-dim mb-3 max-w-2xl leading-relaxed">
          Pick a layout preset on the left, then click any slot to edit its
          founding and regular prices. Stripe Checkout sessions are created
          dynamically at claim time using whichever price applies.
        </p>
        <p className="font-body text-xs text-text-faint mb-10">
          Editing card: <span className="text-white">{card.zone_name}</span> · {card.zone_slug}
        </p>

        <CardBuilder
          card={card}
          layouts={layouts}
          mode="wizard"
          nextHref={nextStep("card") ?? "/admin"}
          prevHref={prevStep("card") ?? undefined}
        />
      </div>
    </>
  );
}

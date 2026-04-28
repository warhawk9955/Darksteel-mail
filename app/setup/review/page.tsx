import { serviceClient } from "@/lib/supabase/server";
import { getPublicSiteConfig } from "@/lib/db/site_config";
import { listZoneSummaries } from "@/lib/db/zones";
import { getCardForZone } from "@/lib/db/cards";
import WizardStepper from "../_components/WizardStepper";
import ReviewStep from "./ReviewStep";

export const dynamic = "force-dynamic";

export default async function ReviewStepPage() {
  const svc = serviceClient();
  const [config, zones] = await Promise.all([
    getPublicSiteConfig(svc),
    listZoneSummaries(svc),
  ]);
  const firstZoneId = zones[0]?.id;
  const card = firstZoneId ? await getCardForZone(svc, firstZoneId) : null;

  return (
    <>
      <WizardStepper current="review" />
      <ReviewStep config={config} card={card} />
    </>
  );
}

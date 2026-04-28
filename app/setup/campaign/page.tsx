import { serviceClient } from "@/lib/supabase/server";
import { getPublicSiteConfig } from "@/lib/db/site_config";
import WizardStepper from "../_components/WizardStepper";
import CampaignStep from "./CampaignStep";

export const dynamic = "force-dynamic";

export default async function CampaignStepPage() {
  const config = await getPublicSiteConfig(serviceClient());
  return (
    <>
      <WizardStepper current="campaign" />
      <CampaignStep initial={config} />
    </>
  );
}

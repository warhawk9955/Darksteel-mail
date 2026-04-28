import { serviceClient } from "@/lib/supabase/server";
import { getPublicSiteConfig } from "@/lib/db/site_config";
import WizardStepper from "../_components/WizardStepper";
import BrandingStep from "./BrandingStep";

export const dynamic = "force-dynamic";

export default async function BrandingStepPage() {
  const config = await getPublicSiteConfig(serviceClient());
  return (
    <>
      <WizardStepper current="branding" />
      <BrandingStep initial={config} />
    </>
  );
}

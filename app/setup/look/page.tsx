import { serviceClient } from "@/lib/supabase/server";
import { getPublicSiteConfig } from "@/lib/db/site_config";
import WizardStepper from "../_components/WizardStepper";
import LookStep from "./LookStep";

export const dynamic = "force-dynamic";

export default async function LookStepPage() {
  const config = await getPublicSiteConfig(serviceClient());
  return (
    <>
      <WizardStepper current="look" />
      <LookStep initial={config} />
    </>
  );
}

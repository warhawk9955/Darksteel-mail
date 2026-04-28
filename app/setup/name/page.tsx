import { serviceClient } from "@/lib/supabase/server";
import { getPublicSiteConfig } from "@/lib/db/site_config";
import WizardStepper from "../_components/WizardStepper";
import NameStep from "./NameStep";

export const dynamic = "force-dynamic";

export default async function NameStepPage() {
  const config = await getPublicSiteConfig(serviceClient());
  return (
    <>
      <WizardStepper current="name" />
      <NameStep initial={config} />
    </>
  );
}

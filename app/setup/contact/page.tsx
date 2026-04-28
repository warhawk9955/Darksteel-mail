import { serviceClient } from "@/lib/supabase/server";
import { getPublicSiteConfig } from "@/lib/db/site_config";
import WizardStepper from "../_components/WizardStepper";
import ContactStep from "./ContactStep";

export const dynamic = "force-dynamic";

export default async function ContactStepPage() {
  const config = await getPublicSiteConfig(serviceClient());
  return (
    <>
      <WizardStepper current="contact" />
      <ContactStep initial={config} />
    </>
  );
}

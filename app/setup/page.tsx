import { redirect } from "next/navigation";
import { serviceClient } from "@/lib/supabase/server";
import { getPublicSiteConfig } from "@/lib/db/site_config";

// /setup → redirect to first incomplete step (heuristic: name -> campaign
// -> contact -> look). Once launched_at is set, dump the operator at
// /admin where edits live.
export default async function SetupRoot() {
  const config = await getPublicSiteConfig(serviceClient());
  if (config.launched_at) redirect("/admin");
  if (!config.business_name || config.business_name === "Darksteel Mail") {
    redirect("/setup/name");
  }
  if (!config.city || !config.state) redirect("/setup/campaign");
  if (!config.contact_email) redirect("/setup/contact");
  redirect("/setup/look");
}

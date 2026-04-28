// Single source of truth for the wizard step order and labels.
// Steps 6 (card), 7 (domain), 8 (review) ship in later phases; they
// appear in the stepper as upcoming.

export const WIZARD_STEPS = [
  { slug: "name",     label: "Name Your Business",  href: "/setup/name",     phase: 3 },
  { slug: "campaign", label: "Campaign Details",    href: "/setup/campaign", phase: 3 },
  { slug: "contact",  label: "Contact Info",        href: "/setup/contact",  phase: 3 },
  { slug: "look",     label: "Pick Your Look",      href: "/setup/look",     phase: 3 },
  { slug: "branding", label: "Upload Branding",     href: "/setup/branding", phase: 3 },
  { slug: "card",     label: "Build Your Card",     href: "/setup/card",     phase: 4, ready: true },
  { slug: "domain",   label: "Your Domain",         href: "/setup/domain",   phase: 5 },
  { slug: "review",   label: "Review & Launch",     href: "/setup/review",   phase: 5 },
] as const;

export type StepSlug = (typeof WIZARD_STEPS)[number]["slug"];

export function stepIndex(slug: StepSlug): number {
  return WIZARD_STEPS.findIndex((s) => s.slug === slug);
}

export function nextStep(slug: StepSlug): string | null {
  const i = stepIndex(slug);
  const next = WIZARD_STEPS[i + 1];
  return next?.href ?? null;
}

export function prevStep(slug: StepSlug): string | null {
  const i = stepIndex(slug);
  const prev = WIZARD_STEPS[i - 1];
  return prev?.href ?? null;
}

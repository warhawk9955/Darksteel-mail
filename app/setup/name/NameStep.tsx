"use client";

import { useState } from "react";
import StepShell from "../_components/StepShell";
import type { SiteConfigPublic, SiteConfigUpsert } from "@/lib/db/site_config";

const TAGLINE_SUGGESTIONS = [
  "Your Neighborhood's Trusted Local Advertisers",
  "Helping Local Businesses Get Noticed",
  "One postcard. Every door. Real reach.",
];

export default function NameStep({ initial }: { initial: SiteConfigPublic }) {
  const [businessName, setBusinessName] = useState(
    initial.business_name === "Darksteel Mail" ? "" : initial.business_name,
  );
  const [tagline, setTagline] = useState(initial.tagline ?? "");

  const draft: SiteConfigPublic = {
    ...initial,
    business_name: businessName || "Your Business",
    tagline: tagline || null,
  };

  const toPatch = (): SiteConfigUpsert => ({
    business_name: businessName.trim() || "Darksteel Mail",
    tagline: tagline.trim() || null,
  });

  return (
    <StepShell
      step="name"
      title="Let's name your operation"
      subtitle="This will be the headline on your website and postcard marketing page."
      draft={draft}
      toPatch={toPatch}
    >
      <Field
        label="Business / Brand Name *"
        helper={`${60 - businessName.length} characters remaining`}
      >
        <input
          required
          maxLength={60}
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="e.g. Tonawanda Spotlight"
          className="w-full bg-panel border border-border focus:border-blue focus:shadow-[0_0_0_3px_var(--blue-glow)] outline-none px-4 py-3 font-body text-base text-white placeholder:text-text-faint transition"
        />
      </Field>

      <Field
        label="Tagline (optional)"
        helper={`${120 - tagline.length} characters remaining`}
      >
        <input
          maxLength={120}
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="e.g. Connecting Tonawanda Businesses With Their Neighbors"
          className="w-full bg-panel border border-border focus:border-blue focus:shadow-[0_0_0_3px_var(--blue-glow)] outline-none px-4 py-3 font-body text-base text-white placeholder:text-text-faint transition"
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {TAGLINE_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTagline(s)}
              className="font-mono text-[0.65rem] tracking-[0.1em] uppercase text-text-dim border border-border px-3 py-1.5 hover:text-white hover:border-blue transition"
            >
              {s}
            </button>
          ))}
        </div>
      </Field>
    </StepShell>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-text-dim block mb-2">
        {label}
      </span>
      {children}
      {helper ? (
        <span className="font-mono text-[0.65rem] tracking-[0.1em] uppercase text-text-faint mt-2 block text-right">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

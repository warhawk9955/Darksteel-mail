"use client";

import { useState } from "react";
import StepShell from "../_components/StepShell";
import type { SiteConfigPublic, SiteConfigUpsert } from "@/lib/db/site_config";

const SOCIAL_KEYS = ["website", "facebook", "instagram", "twitter", "linkedin"] as const;
type SocialKey = typeof SOCIAL_KEYS[number];

export default function ContactStep({ initial }: { initial: SiteConfigPublic }) {
  const [email, setEmail] = useState(initial.contact_email ?? "");
  const [phone, setPhone] = useState(initial.contact_phone ?? "");
  const [showEmail, setShowEmail] = useState(initial.show_email_on_site);
  const [showPhone, setShowPhone] = useState(initial.show_phone_on_site);
  const [social, setSocial] = useState<Record<string, string>>({
    ...initial.social_links,
  });
  const [showSocial, setShowSocial] = useState(
    Object.values(initial.social_links ?? {}).some(Boolean),
  );

  const draft: SiteConfigPublic = {
    ...initial,
    contact_email: showEmail ? email || null : null,
    contact_phone: showPhone ? phone || null : null,
    show_email_on_site: showEmail,
    show_phone_on_site: showPhone,
    social_links: social,
  };

  const toPatch = (): SiteConfigUpsert => ({
    contact_email: email.trim() || null,
    contact_phone: phone.trim() || null,
    show_email_on_site: showEmail,
    show_phone_on_site: showPhone,
    social_links: Object.fromEntries(
      Object.entries(social)
        .map(([k, v]) => [k, v.trim()])
        .filter(([, v]) => Boolean(v)),
    ),
  });

  function setSocialField(key: SocialKey, value: string) {
    setSocial((s) => {
      const next = { ...s };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  }

  return (
    <StepShell
      step="contact"
      title="How should prospects reach you?"
      subtitle="Set up contact info that will appear on your website."
      draft={draft}
      toPatch={toPatch}
    >
      <Field label="Business email *">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourbusiness.com"
          className={fieldCss}
        />
      </Field>

      <Field label="Business phone">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
          className={fieldCss}
        />
      </Field>

      <div className="bg-panel border border-border p-5">
        <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-text-dim mb-4">
          Contact display options
        </div>
        <Toggle
          label="Show email on website"
          checked={showEmail}
          onChange={setShowEmail}
        />
        <Toggle
          label="Show phone on website"
          checked={showPhone}
          onChange={setShowPhone}
        />
      </div>

      <button
        type="button"
        onClick={() => setShowSocial((v) => !v)}
        className="text-left font-mono text-[0.7rem] tracking-[0.15em] uppercase text-text-dim hover:text-white transition"
      >
        {showSocial ? "▾" : "▸"} Add social links
      </button>

      {showSocial ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SOCIAL_KEYS.map((k) => (
            <Field key={k} label={k}>
              <input
                value={social[k] ?? ""}
                onChange={(e) => setSocialField(k, e.target.value)}
                placeholder={`https://...`}
                className={fieldCss}
              />
            </Field>
          ))}
        </div>
      ) : null}
    </StepShell>
  );
}

const fieldCss =
  "w-full bg-panel border border-border focus:border-blue focus:shadow-[0_0_0_3px_var(--blue-glow)] outline-none px-4 py-3 font-body text-base text-white placeholder:text-text-faint transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-text-dim block mb-2 capitalize">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="font-body text-sm">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${
          checked ? "bg-blue" : "bg-panel-2 border border-border"
        }`}
      >
        <span
          className={`block w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

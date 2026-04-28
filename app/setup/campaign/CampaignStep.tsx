"use client";

import { useState } from "react";
import StepShell from "../_components/StepShell";
import type { SiteConfigPublic, SiteConfigUpsert } from "@/lib/db/site_config";

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const SIZE_PRESETS = [2500, 5000, 7500, 10000, 15000];
const SPOT_PRESETS = [10, 12, 14, 16, 20, 24];

export default function CampaignStep({ initial }: { initial: SiteConfigPublic }) {
  const [city, setCity] = useState(initial.city ?? "");
  const [state, setState] = useState(initial.state ?? "");
  const [households, setHouseholds] = useState<number>(
    initial.household_count ?? 5000,
  );
  const [adSpots, setAdSpots] = useState<number>(
    initial.ad_spot_count_default ?? 16,
  );
  const [cardSize, setCardSize] = useState(initial.card_size_inches ?? "9×12\"");
  const [zipInput, setZipInput] = useState("");
  const [zips, setZips] = useState<string[]>(initial.mailing_zip_codes ?? []);
  const [deadline, setDeadline] = useState<string>(
    initial.reservation_deadline ?? "",
  );

  const draft: SiteConfigPublic = {
    ...initial,
    city: city || null,
    state: state || null,
    household_count: households,
    ad_spot_count_default: adSpots,
    card_size_inches: cardSize || null,
    mailing_zip_codes: zips,
    reservation_deadline: deadline || null,
  };

  const toPatch = (): SiteConfigUpsert => ({
    city: city.trim() || null,
    state: state || null,
    household_count: households,
    ad_spot_count_default: adSpots,
    card_size_inches: cardSize || null,
    mailing_zip_codes: zips,
    reservation_deadline: deadline ? new Date(deadline).toISOString() : null,
  });

  function addZip() {
    const v = zipInput.trim();
    if (!/^\d{5}$/.test(v)) return;
    if (zips.includes(v)) return;
    setZips([...zips, v]);
    setZipInput("");
  }

  return (
    <StepShell
      step="campaign"
      title="Where are you mailing?"
      subtitle="Tell us about your direct-mail campaign coverage area."
      draft={draft}
      toPatch={toPatch}
    >
      <Field label="Campaign city / area *">
        <input
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Tonawanda, North Buffalo, South Tampa"
          className={fieldCss}
        />
      </Field>

      <Field label="State *">
        <select
          required
          value={state}
          onChange={(e) => setState(e.target.value)}
          className={fieldCss}
        >
          <option value="">Select a state</option>
          {STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      <Field
        label="Campaign size"
        helper="How many households will receive your postcard"
      >
        <select
          value={households}
          onChange={(e) => setHouseholds(Number(e.target.value))}
          className={fieldCss}
        >
          {SIZE_PRESETS.map((n) => (
            <option key={n} value={n}>{n.toLocaleString()} households</option>
          ))}
        </select>
      </Field>

      <Field
        label="Number of ad spots"
        helper="Standard 9×12 postcards have 16 spots (8 per side)"
      >
        <select
          value={adSpots}
          onChange={(e) => setAdSpots(Number(e.target.value))}
          className={fieldCss}
        >
          {SPOT_PRESETS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </Field>

      <Field label="Card size" helper="The physical size of your postcard">
        <select
          value={cardSize}
          onChange={(e) => setCardSize(e.target.value)}
          className={fieldCss}
        >
          {["9×12\"","6.5×11\"","6×11\"","5.5×8.5\""].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      <Field
        label="Mailing ZIP codes (optional)"
        helper="Add the ZIPs you're mailing to — they'll appear in your site stats"
      >
        <div className="flex gap-2">
          <input
            value={zipInput}
            onChange={(e) => setZipInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addZip();
              }
            }}
            placeholder="Enter ZIP code"
            inputMode="numeric"
            maxLength={5}
            className={`${fieldCss} flex-1`}
          />
          <button
            type="button"
            onClick={addZip}
            className="bg-blue text-bg font-body font-bold text-sm uppercase tracking-wide px-5"
          >
            Add
          </button>
        </div>
        {zips.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-3">
            {zips.map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZips(zips.filter((x) => x !== z))}
                className="font-mono text-[0.7rem] tracking-[0.1em] uppercase text-text-dim border border-border px-3 py-1.5 hover:text-red transition"
              >
                {z} ✕
              </button>
            ))}
          </div>
        ) : null}
      </Field>

      <Field
        label="Reservation deadline (optional)"
        helper="If set, a countdown timer will appear on your site"
      >
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={fieldCss}
        />
      </Field>
    </StepShell>
  );
}

const fieldCss =
  "w-full bg-panel border border-border focus:border-blue focus:shadow-[0_0_0_3px_var(--blue-glow)] outline-none px-4 py-3 font-body text-base text-white placeholder:text-text-faint transition";

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
        <span className="font-body text-xs text-text-faint mt-2 block">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

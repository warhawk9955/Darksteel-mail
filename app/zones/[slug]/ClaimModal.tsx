"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicSpot } from "@/lib/db/spots";
import type { CategoryWithGroup } from "@/lib/db/categories";
import {
  ACCENT_COLOR_HEX,
  ClaimSchema,
  type AccentColor,
  type Claim,
} from "@/lib/validation/claim";
import CategorySelect from "./CategorySelect";

interface Props {
  spot: PublicSpot;
  priceCents: number;
  isFoundingRate: boolean;
  categories: CategoryWithGroup[];
  takenGroupIds: ReadonlySet<string>;
  onClose: () => void;
}

type Field = keyof Omit<Claim, "spotId">;

const ACCENTS: AccentColor[] = ["blue", "red", "amber", "teal", "pink", "orange"];

export default function ClaimModal({
  spot,
  priceCents,
  isFoundingRate,
  categories,
  takenGroupIds,
  onClose,
}: Props) {
  const firstCategory = useMemo(
    () => categories.find((c) => !takenGroupIds.has(c.group.id)),
    [categories, takenGroupIds],
  );

  const [form, setForm] = useState({
    categoryId: firstCategory?.id ?? "",
    businessName: "",
    contactEmail: "",
    offer: firstCategory?.default_offer ?? "",
    phone: "",
    url: "",
    accentColor: "blue" as AccentColor,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // When the user picks a different category, pre-fill the offer with that
  // category's default offer (only if they haven't already customised it).
  const [offerEdited, setOfferEdited] = useState(false);

  useEffect(() => {
    if (offerEdited) return;
    const cat = categories.find((c) => c.id === form.categoryId);
    if (cat?.default_offer) {
      setForm((f) => ({ ...f, offer: cat.default_offer ?? "" }));
    }
  }, [form.categoryId, categories, offerEdited]);

  // ESC to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  function set<K extends Field>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "offer") setOfferEdited(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const payload: Claim = {
      spotId: spot.id,
      categoryId: form.categoryId,
      businessName: form.businessName,
      contactEmail: form.contactEmail,
      offer: form.offer,
      phone: form.phone,
      url: form.url,
      accentColor: form.accentColor,
    };

    const local = ClaimSchema.safeParse(payload);
    if (!local.success) {
      const first = local.error.issues[0];
      setErrorMessage(
        first
          ? `${first.path.join(".") || "form"}: ${first.message}`
          : "Please check the form",
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local.data),
      });
      const text = await res.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }

      if (res.status === 200) {
        const url =
          json && typeof json === "object" && "url" in json
            ? (json as { url?: unknown }).url
            : null;
        if (typeof url === "string" && url.length > 0) {
          window.location.assign(url);
          return;
        }
        setErrorMessage("Server returned 200 without a checkout URL.");
        return;
      }

      if (res.status === 501) {
        // Stub path until commit 6.
        const message =
          (json && typeof json === "object" && "message" in json
            ? String((json as { message?: unknown }).message ?? "")
            : "") || "Checkout endpoint not yet wired.";
        setInfoMessage(
          `${message} Request validated — nothing was saved.`,
        );
        return;
      }

      const message =
        json && typeof json === "object" && "error" in json
          ? String((json as { error?: unknown }).error ?? "Request failed")
          : `HTTP ${res.status}`;
      setErrorMessage(message);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Network error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const priceLabel = `$${(priceCents / 100).toLocaleString()}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Claim spot ${spot.position}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-panel border border-border-hot max-h-[92vh] overflow-y-auto">
        <header className="flex items-start justify-between gap-4 p-6 border-b border-border">
          <div>
            <div className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-blue mb-2">
              Spot {spot.position.toString().padStart(2, "0")} · {spot.tier}
            </div>
            <h2 className="font-display text-2xl tracking-[0.04em] uppercase leading-none">
              Lock in this spot
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-text-dim hover:text-white disabled:opacity-50 p-2 -m-2"
            aria-label="Close"
          >
            Close ×
          </button>
        </header>

        <form onSubmit={submit} className="p-6 flex flex-col gap-4">
          <Field label="Business name">
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              required
              maxLength={80}
              placeholder="e.g. Laurel Dental Co."
              className={inputCls}
              autoFocus
            />
          </Field>

          <Field label="Contact email">
            <input
              type="email"
              value={form.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              required
              maxLength={200}
              placeholder="owner@example.com"
              className={inputCls}
            />
          </Field>

          <Field label="Category">
            <CategorySelect
              categories={categories}
              takenGroupIds={takenGroupIds}
              value={form.categoryId}
              onChange={(id) => {
                setOfferEdited(false);
                set("categoryId", id);
              }}
            />
          </Field>

          <Field label="Offer (as shown on postcard)">
            <input
              type="text"
              value={form.offer}
              onChange={(e) => set("offer", e.target.value)}
              required
              maxLength={80}
              placeholder="$79 new-patient exam"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
                maxLength={40}
                placeholder="716 · 555 · 0187"
                className={inputCls}
              />
            </Field>
            <Field label="Website">
              <input
                type="text"
                value={form.url}
                onChange={(e) => set("url", e.target.value)}
                required
                maxLength={200}
                placeholder="laureldental.com"
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Accent color">
            <div className="flex gap-2 flex-wrap">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("accentColor", c)}
                  aria-label={c}
                  className={[
                    "w-8 h-8 rounded-full transition border-2",
                    form.accentColor === c
                      ? "border-white"
                      : "border-transparent hover:scale-110",
                  ].join(" ")}
                  style={{ background: ACCENT_COLOR_HEX[c] }}
                />
              ))}
            </div>
          </Field>

          {errorMessage ? (
            <div className="font-mono text-xs tracking-[0.1em] uppercase text-red border border-red/50 bg-red/10 p-3">
              {errorMessage}
            </div>
          ) : null}
          {infoMessage ? (
            <div className="font-mono text-[0.7rem] tracking-[0.1em] uppercase text-blue border border-blue/40 bg-blue/10 p-3 leading-relaxed">
              {infoMessage}
            </div>
          ) : null}

          <div className="pt-4 border-t border-border flex items-end justify-between gap-4">
            <div>
              <div className="font-display text-3xl leading-none text-blue">
                {priceLabel}
              </div>
              <div className="font-mono text-[0.62rem] tracking-[0.15em] uppercase text-text-dim mt-1">
                {isFoundingRate ? "Founding rate" : "Regular rate"} · one-time
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue text-bg font-display text-sm tracking-[0.06em] uppercase px-6 py-3 hover:shadow-blue-glow hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Working…" : "Continue to payment →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-[0.62rem] tracking-[0.15em] uppercase text-text-faint mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full bg-bg border border-border text-text font-body text-sm px-3 py-2.5 focus:border-blue focus:shadow-[0_0_0_3px_var(--blue-glow)] focus:outline-none transition placeholder:text-text-faint";

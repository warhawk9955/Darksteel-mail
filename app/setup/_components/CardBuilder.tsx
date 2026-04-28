"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type {
  CardLayout,
  CardSlot,
  CardSummary,
  SlotSize,
} from "@/lib/db/cards";
import { DEFAULT_SIZE_PRICE_CENTS } from "@/lib/db/cards";

type Mode = "wizard" | "admin";

interface Props {
  card: CardSummary;
  layouts: CardLayout[];
  mode: Mode;
  nextHref?: string;
  prevHref?: string;
}

interface EditedPrices {
  [spotId: string]: { founding: number; regular: number };
}

export default function CardBuilder({ card, layouts, mode, nextHref, prevHref }: Props) {
  const router = useRouter();
  const [pendingLayout, setPendingLayout] = useState<string | null>(null);
  const [edits, setEdits] = useState<EditedPrices>({});
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasActiveClaims = card.spots.some((s) => s.status !== "available");
  const layoutChanged = pendingLayout && pendingLayout !== card.layout_id;
  const dirty = layoutChanged || Object.keys(edits).length > 0;

  const front = card.spots.filter((s) => s.face === "front");
  const back  = card.spots.filter((s) => s.face === "back");
  const cols = Math.max(
    4,
    ...card.spots.map((s) => (s.col_position ?? 1) + (s.col_span - 1)),
  );

  const activeSlot = useMemo(
    () => card.spots.find((s) => s.id === activeSlotId) ?? null,
    [activeSlotId, card.spots],
  );

  function slotPrice(spotId: string, kind: "founding" | "regular") {
    const slot = card.spots.find((s) => s.id === spotId);
    const fallback =
      kind === "founding"
        ? slot?.founding_price_cents ?? DEFAULT_SIZE_PRICE_CENTS.medium
        : slot?.regular_price_cents ?? DEFAULT_SIZE_PRICE_CENTS.medium;
    return edits[spotId]?.[kind] ?? fallback;
  }

  function setSlotPrice(spotId: string, kind: "founding" | "regular", cents: number) {
    setEdits((prev) => ({
      ...prev,
      [spotId]: {
        founding: kind === "founding" ? cents : prev[spotId]?.founding ?? slotPrice(spotId, "founding"),
        regular:  kind === "regular"  ? cents : prev[spotId]?.regular  ?? slotPrice(spotId, "regular"),
      },
    }));
  }

  async function save() {
    setError(null);
    const body: Record<string, unknown> = {};

    if (layoutChanged) {
      body.card_layout_id = pendingLayout;
    }

    const slot_prices = Object.entries(edits).map(([spot_id, p]) => ({
      spot_id,
      founding_price_cents: p.founding,
      regular_price_cents: p.regular,
    }));
    if (slot_prices.length > 0) body.slot_prices = slot_prices;

    if (Object.keys(body).length === 0) {
      // Nothing to save — just go forward in wizard mode.
      if (mode === "wizard" && nextHref) router.push(nextHref);
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/cards/${card.zone_id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `save failed (${res.status})`);
        }
        if (mode === "wizard" && nextHref) router.push(nextHref);
        else router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "save failed");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
      <aside className="lg:sticky lg:top-24 self-start">
        <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-text-dim mb-3">
          Layout preset
        </div>
        <div className="flex flex-col gap-2">
          {layouts.map((l) => {
            const selected = (pendingLayout ?? card.layout_id) === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setPendingLayout(l.id)}
                disabled={hasActiveClaims}
                className={`text-left p-3 border transition ${
                  selected
                    ? "border-blue shadow-[0_0_0_2px_var(--blue-glow)]"
                    : "border-border hover:border-border-hot"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={hasActiveClaims ? "Layout locked — clear pending/sold claims first" : ""}
              >
                <div className="font-display text-sm tracking-[0.04em] mb-1">
                  {l.name}
                </div>
                <div className="font-body text-xs text-text-dim">
                  {l.slots_definition.length} slots
                </div>
              </button>
            );
          })}
        </div>
        {hasActiveClaims ? (
          <p className="font-body text-xs text-text-faint mt-3">
            Layout switching is disabled while any spot is pending or sold.
          </p>
        ) : null}
      </aside>

      <div>
        <PostcardFace label="Front" cols={cols} slots={front} editing={activeSlotId} onSelect={setActiveSlotId} priceFor={slotPrice} />
        <div className="mt-6" />
        <PostcardFace label="Back"  cols={cols} slots={back}  editing={activeSlotId} onSelect={setActiveSlotId} priceFor={slotPrice} />

        {activeSlot ? (
          <div className="mt-8 bg-panel border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-text-dim mb-1">
                  Slot {activeSlot.position} · {activeSlot.face} · {activeSlot.slot_size}
                </div>
                <div className="font-body text-xs text-text-faint">
                  Status: {activeSlot.status}
                  {activeSlot.business_name ? ` · ${activeSlot.business_name}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSlotId(null)}
                className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-text-dim hover:text-red transition"
              >
                Close ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PriceInput
                label="Founding price (USD)"
                cents={slotPrice(activeSlot.id, "founding")}
                onChange={(c) => setSlotPrice(activeSlot.id, "founding", c)}
              />
              <PriceInput
                label="Regular price (USD)"
                cents={slotPrice(activeSlot.id, "regular")}
                onChange={(c) => setSlotPrice(activeSlot.id, "regular", c)}
              />
            </div>
            <p className="font-body text-xs text-text-faint mt-4 leading-relaxed">
              Founding rate applies until the zone hits the founding threshold
              (50% sold by default). Stripe Checkout sessions are created
              dynamically at claim time using whichever price applies.
            </p>
          </div>
        ) : (
          <div className="mt-8 font-body text-sm text-text-faint">
            Click any slot above to edit its founding and regular prices.
          </div>
        )}

        {error ? (
          <div className="mt-6 font-mono text-[0.7rem] tracking-[0.15em] uppercase text-red">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between mt-10">
          {prevHref ? (
            <Link
              href={prevHref}
              className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-text-dim hover:text-white transition inline-flex items-center gap-2"
            >
              <span aria-hidden>←</span> Back
            </Link>
          ) : <span />}

          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="bg-blue text-bg font-body font-bold text-sm uppercase tracking-wide px-7 py-3 hover:shadow-blue-glow hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:translate-y-0"
          >
            {pending
              ? "Saving…"
              : !dirty && mode === "wizard"
                ? "Continue →"
                : mode === "wizard"
                  ? "Save & Continue →"
                  : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PostcardFace({
  label,
  cols,
  slots,
  editing,
  onSelect,
  priceFor,
}: {
  label: string;
  cols: number;
  slots: CardSlot[];
  editing: string | null;
  onSelect: (id: string) => void;
  priceFor: (spotId: string, kind: "founding" | "regular") => number;
}) {
  const rows = Math.max(2, ...slots.map((s) => (s.row_position ?? 1) + (s.row_span - 1)));
  return (
    <div>
      <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-text-dim mb-2">
        {label}
      </div>
      <div
        className="bg-[#f5f1e8] border border-border p-4 grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          aspectRatio: `${cols} / ${rows}`,
        }}
      >
        {slots.length === 0 ? (
          <div
            className="col-span-full row-span-full flex items-center justify-center text-[#888]"
            style={{ gridColumn: `1 / span ${cols}`, gridRow: `1 / span ${rows}` }}
          >
            <span className="font-body text-xs">No slots on this face</span>
          </div>
        ) : null}
        {slots.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={`bg-white border-2 transition flex flex-col items-center justify-center p-2 ${
              editing === s.id
                ? "border-blue shadow-[0_0_0_3px_var(--blue-glow)]"
                : "border-[#cccccc] hover:border-blue"
            }`}
            style={{
              gridColumn: `${s.col_position ?? 1} / span ${s.col_span}`,
              gridRow:    `${s.row_position ?? 1} / span ${s.row_span}`,
            }}
          >
            <span className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#888]">
              #{s.position} · {s.slot_size}
            </span>
            <span className="font-display text-sm tracking-[0.04em] text-[#222] mt-1">
              ${(priceFor(s.id, "founding") / 100).toLocaleString()}
            </span>
            <span className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#888]">
              {s.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PriceInput({
  label,
  cents,
  onChange,
}: {
  label: string;
  cents: number;
  onChange: (cents: number) => void;
}) {
  const [text, setText] = useState((cents / 100).toString());
  return (
    <label className="block">
      <span className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-text-dim block mb-2">
        {label}
      </span>
      <div className="flex items-stretch">
        <span className="bg-panel-2 border border-border border-r-0 px-3 flex items-center font-body text-text-dim">
          $
        </span>
        <input
          type="number"
          min={0}
          step={1}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= 0) onChange(Math.round(n * 100));
          }}
          className="flex-1 bg-panel border border-border focus:border-blue focus:shadow-[0_0_0_3px_var(--blue-glow)] outline-none px-4 py-3 font-body text-base text-white placeholder:text-text-faint transition"
        />
      </div>
    </label>
  );
}

"use client";

import { useState } from "react";
import type { PublicSpot } from "@/lib/db/spots";
import type { CategoryWithGroup } from "@/lib/db/categories";
import ClaimModal from "./ClaimModal";

interface Props {
  spots: PublicSpot[];
  categories: CategoryWithGroup[];
  takenGroupIds: string[];
  standardFoundingCents: number;
  standardRegularCents: number;
  featuredFoundingCents: number;
  featuredRegularCents: number;
  isFoundingRate: boolean;
}

export default function SpotGrid({
  spots,
  categories,
  takenGroupIds,
  standardFoundingCents,
  standardRegularCents,
  featuredFoundingCents,
  featuredRegularCents,
  isFoundingRate,
}: Props) {
  const [activeSpotId, setActiveSpotId] = useState<string | null>(null);
  const activeSpot = spots.find((s) => s.id === activeSpotId) ?? null;
  const takenGroupSet = new Set(takenGroupIds);

  function priceFor(spot: PublicSpot): number {
    // Spot-level prices (set by the wizard's card builder) win over
    // the legacy zone-level fallback. Keeps the displayed price in
    // sync with what /api/checkout will charge.
    if (spot.founding_price_cents != null && spot.regular_price_cents != null) {
      return isFoundingRate ? spot.founding_price_cents : spot.regular_price_cents;
    }
    const founding =
      spot.tier === "featured"
        ? featuredFoundingCents
        : standardFoundingCents;
    const regular =
      spot.tier === "featured"
        ? featuredRegularCents
        : standardRegularCents;
    return isFoundingRate ? founding : regular;
  }

  return (
    <>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {spots.map((spot) => {
          const isAvailable = spot.status === "available";
          const price = priceFor(spot);
          const label =
            spot.status === "sold"
              ? "Taken"
              : spot.status === "pending"
                ? "Reserved"
                : "Available";
          return (
            <button
              key={spot.id}
              type="button"
              disabled={!isAvailable}
              onClick={() => setActiveSpotId(spot.id)}
              className={[
                "text-left bg-panel border p-4 flex flex-col gap-2 transition",
                isAvailable
                  ? "border-border hover:border-blue hover:-translate-y-0.5 cursor-pointer"
                  : "border-border opacity-60 cursor-not-allowed",
              ].join(" ")}
              aria-label={
                isAvailable
                  ? `Claim spot ${spot.position}`
                  : `Spot ${spot.position} unavailable`
              }
            >
              <div className="flex items-center justify-between">
                <div className="font-mono text-[0.6rem] tracking-[0.18em] uppercase text-text-faint">
                  Spot {spot.position.toString().padStart(2, "0")}
                </div>
                <div
                  className={[
                    "font-mono text-[0.6rem] tracking-[0.15em] uppercase px-1.5 py-[2px]",
                    spot.tier === "featured"
                      ? "bg-orange text-bg"
                      : "bg-border text-text-dim",
                  ].join(" ")}
                >
                  {spot.tier}
                </div>
              </div>

              <div
                className={[
                  "font-display text-lg tracking-[0.04em] uppercase leading-none",
                  isAvailable ? "text-blue" : "text-text-dim",
                ].join(" ")}
              >
                {label}
              </div>

              <div className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-text-faint">
                {isFoundingRate ? "Founding rate" : "Regular rate"}
              </div>
              <div className="font-display text-2xl leading-none text-white">
                ${(price / 100).toLocaleString()}
              </div>

              {isAvailable ? (
                <div className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-blue mt-1">
                  Click to claim →
                </div>
              ) : spot.business_name ? (
                <div className="font-body text-sm text-text-dim mt-1 truncate">
                  {spot.business_name}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {activeSpot ? (
        <ClaimModal
          spot={activeSpot}
          priceCents={priceFor(activeSpot)}
          isFoundingRate={isFoundingRate}
          categories={categories}
          takenGroupIds={takenGroupSet}
          onClose={() => setActiveSpotId(null)}
        />
      ) : null}
    </>
  );
}

import type { PublicSpot } from "@/lib/db/spots";

// Read-only list of the 10 spots and their status. Commit 5 adds the
// interactive grid + claim modal on top of this shape.

interface Props {
  spots: PublicSpot[];
  standardFoundingCents: number;
  standardRegularCents: number;
  featuredFoundingCents: number;
  featuredRegularCents: number;
  isFoundingRate: boolean;
}

export default function SpotAvailabilityRow({
  spots,
  standardFoundingCents,
  standardRegularCents,
  featuredFoundingCents,
  featuredRegularCents,
  isFoundingRate,
}: Props) {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
      {spots.map((spot) => {
        const founding =
          spot.tier === "featured"
            ? featuredFoundingCents
            : standardFoundingCents;
        const regular =
          spot.tier === "featured"
            ? featuredRegularCents
            : standardRegularCents;
        const priceCents = isFoundingRate ? founding : regular;
        return (
          <SpotCard
            key={spot.id}
            spot={spot}
            priceCents={priceCents}
            isFoundingRate={isFoundingRate}
          />
        );
      })}
    </div>
  );
}

function SpotCard({
  spot,
  priceCents,
  isFoundingRate,
}: {
  spot: PublicSpot;
  priceCents: number;
  isFoundingRate: boolean;
}) {
  const isAvailable = spot.status === "available";
  const label =
    spot.status === "sold"
      ? "Taken"
      : spot.status === "pending"
        ? "Reserved"
        : "Available";

  return (
    <div
      className={[
        "bg-panel border p-4 flex flex-col gap-2 transition",
        isAvailable
          ? "border-border hover:border-border-hot"
          : "border-border opacity-70",
      ].join(" ")}
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
        ${(priceCents / 100).toLocaleString()}
      </div>

      {isAvailable ? (
        <div className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-text-dim mt-1">
          Claim flow in the next commit
        </div>
      ) : spot.business_name ? (
        <div className="font-body text-sm text-text-dim mt-1 truncate">
          {spot.business_name}
        </div>
      ) : null}
    </div>
  );
}

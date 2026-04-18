import type { PublicSpot } from "@/lib/db/spots";

// Non-interactive postcard render, pattern-matched to
// design-reference/postcard-live-demo.html. Pure server component.
// Front = 8 standard spots in 4x2. Back = 2 featured heroes + brand + indicia.

interface Props {
  spots: PublicSpot[];
  zoneName: string;
  dropDateLabel: string; // e.g. "May 2026"
  issueNumber: string; // e.g. "001"
}

export default function PostcardPreview({
  spots,
  zoneName,
  dropDateLabel,
  issueNumber,
}: Props) {
  const standard = spots
    .filter((s) => s.tier === "standard")
    .sort((a, b) => a.position - b.position);
  const featured = spots
    .filter((s) => s.tier === "featured")
    .sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col gap-6">
      {/* Front */}
      <PostcardShell label={`Front · 8 standard spots · ${zoneName}`}>
        <div className="grid grid-rows-[54px_1fr_32px] h-full">
          <div className="bg-blue text-bg flex items-center justify-between px-5">
            <div className="flex items-center gap-2 font-display text-xl tracking-[0.08em] uppercase">
              <span className="w-5 h-5 bg-bg rotate-45 relative">
                <span className="absolute inset-[3px] bg-blue" />
              </span>
              Darksteel Mail
            </div>
            <div className="font-mono text-[0.65rem] tracking-[0.18em] uppercase text-right">
              Eight local businesses · One mailbox · {dropDateLabel}
            </div>
          </div>

          <div className="grid grid-cols-4 grid-rows-2 gap-[2px] bg-[#1a1a1a] p-[2px]">
            {standard.map((spot) => (
              <FrontSpotCell key={spot.id} spot={spot} />
            ))}
          </div>

          <div className="flex items-center justify-between px-5 border-t border-[#2a2a2a] font-mono text-[0.55rem] tracking-[0.14em] uppercase text-[#555]">
            <div>
              <span className="text-blue font-medium">Keep this card</span>
              <span className="text-[#888]"> · 10 neighbors · 1 place</span>
            </div>
            <div>Issue {issueNumber}</div>
          </div>
        </div>
      </PostcardShell>

      {/* Back */}
      <PostcardShell label={`Back · 2 featured + brand · ${zoneName}`}>
        <div
          className="grid h-full text-white"
          style={{ gridTemplateColumns: "1.1fr 1fr" }}
        >
          <div className="p-3 grid grid-rows-[32px_1fr_1fr] gap-2 overflow-hidden border-r border-dashed border-[#2a2a2a]">
            <div className="flex items-center justify-between pb-2 border-b border-[#2a2a2a]">
              <div className="flex items-center gap-2">
                <span className="w-[18px] h-[18px] bg-gradient-to-br from-blue to-red rotate-45 relative">
                  <span className="absolute inset-[3px] bg-bg" />
                </span>
                <span className="font-display text-[0.95rem] tracking-[0.08em] uppercase">
                  Darksteel Mail
                </span>
              </div>
              <div className="font-mono text-[0.5rem] tracking-[0.14em] uppercase text-[#666] text-right leading-[1.3]">
                Issue <span className="text-blue">{issueNumber}</span>
                <br />
                {dropDateLabel}
              </div>
            </div>
            {featured[0] ? (
              <FeaturedHero spot={featured[0]} accent="blue" />
            ) : null}
            {featured[1] ? (
              <FeaturedHero spot={featured[1]} accent="orange" />
            ) : null}
          </div>
          <div className="p-3 pl-5 grid grid-rows-[auto_auto_1fr_auto] gap-2">
            <div className="justify-self-end font-mono text-[0.46rem] text-center p-2 border border-[#666] leading-[1.4] uppercase tracking-[0.05em] text-[#bbb] bg-bg">
              ECRWSS
              <br />
              EDDM
              <br />
              U.S. POSTAGE PAID
              <br />
              {zoneName.toUpperCase()}, NY
            </div>
            <div className="font-mono text-[0.5rem] leading-[1.5] text-[#888] uppercase tracking-[0.05em]">
              Darksteel Mail
              <br />
              Tonawanda, NY 14150
              <br />
              darksteelmail.com
            </div>
            <div className="self-center p-2 bg-[#0e1a24] border-l-2 border-blue">
              <div className="font-display text-[0.75rem] text-white tracking-[0.04em] uppercase leading-none mb-1">
                Your business
                <br />
                <em className="text-blue not-italic font-display">
                  here next?
                </em>
              </div>
              <div className="text-[0.52rem] text-[#aaa] leading-[1.5] mb-1">
                8 standard spots + 2 featured. One per category.
              </div>
              <div className="font-mono text-[0.5rem] text-blue tracking-[0.08em] uppercase">
                darksteelmail.com →
              </div>
            </div>
            <div className="self-end font-mono text-[0.65rem] leading-[1.5] uppercase text-[#ddd] py-1 border-t border-[#2a2a2a]">
              **********ECRWSS****
              <br />
              Local Postal Customer
              <br />
              {zoneName}, NY
            </div>
          </div>
        </div>
      </PostcardShell>
    </div>
  );
}

function PostcardShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-text-dim mb-2 flex items-center gap-2">
        <span className="w-5 h-px bg-text-faint" />
        {label}
      </div>
      <div className="bg-[#3a3834] p-4 sm:p-8 rounded-[4px] flex justify-center items-center">
        <div
          className="w-full max-w-[880px] bg-bg overflow-hidden relative rounded-[3px]"
          style={{
            aspectRatio: "11 / 6.5",
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.15), 0 10px 30px rgba(0,0,0,0.3), 0 30px 60px rgba(0,0,0,0.2)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function FrontSpotCell({ spot }: { spot: PublicSpot }) {
  if (spot.status === "sold" || spot.status === "pending") {
    return <FilledSpot spot={spot} />;
  }
  return <AvailableSpot position={spot.position} />;
}

function FilledSpot({ spot }: { spot: PublicSpot }) {
  const accent = spot.accent_color ?? "blue";
  const offerParts = (spot.offer ?? "").split(" ");
  const headline = offerParts[0] ?? "";
  const rest = offerParts.slice(1).join(" ");
  const lastFourPhone = (spot.phone ?? "").replace(/\D/g, "").slice(-4);

  return (
    <div
      className="bg-bg p-2.5 flex flex-col justify-between relative overflow-hidden min-h-0"
      data-accent={accent}
    >
      <div>
        <div className="font-display text-[0.72rem] leading-[1.05] tracking-[0.04em] uppercase text-white mb-1">
          {spot.business_name ?? "Reserved"}
        </div>
        <div className="font-mono text-[0.52rem] text-[#888] uppercase tracking-[0.12em] mb-1">
          {spot.status === "pending" ? "Reserved · pending" : "Local business"}
        </div>
      </div>
      <div
        className="font-serif text-base leading-none my-auto"
        style={{ color: accentColor(accent) }}
      >
        <em className="italic">{headline}</em>{" "}
        <span className="text-white not-italic">{rest}</span>
      </div>
      <div className="flex justify-between items-center gap-1 pt-1 border-t border-[#2a2a2a] font-mono text-[0.48rem] text-white tracking-[0.1em] uppercase">
        <span className="truncate">{spot.url ?? ""}</span>
        <span style={{ color: accentColor(accent) }}>
          {lastFourPhone || "—"}
        </span>
      </div>
    </div>
  );
}

function AvailableSpot({ position }: { position: number }) {
  return (
    <div className="bg-bg p-2.5 flex flex-col items-center justify-center gap-1 relative overflow-hidden min-h-0 border-dashed border-[#2a2a2a]">
      <div className="font-mono text-[0.5rem] tracking-[0.2em] uppercase text-text-dim">
        Spot {position.toString().padStart(2, "0")}
      </div>
      <div className="font-display text-[0.85rem] text-blue tracking-[0.08em] uppercase">
        Available
      </div>
      <div className="font-mono text-[0.45rem] tracking-[0.15em] uppercase text-text-faint">
        One per category
      </div>
    </div>
  );
}

function FeaturedHero({
  spot,
  accent,
}: {
  spot: PublicSpot;
  accent: "blue" | "orange";
}) {
  const color = accent === "blue" ? "var(--blue)" : "var(--orange)";
  if (spot.status === "available") {
    return (
      <div className="bg-bg border border-[#2a2a2a] p-3 grid grid-cols-[1.2fr_1fr] gap-2 relative min-h-0 overflow-hidden">
        <div
          className="absolute top-0 right-0 font-mono text-[0.48rem] font-bold px-1.5 py-[2px] tracking-[0.14em] uppercase"
          style={{ background: color, color: "var(--bg)" }}
        >
          Featured
        </div>
        <div className="flex flex-col justify-center gap-1 min-w-0">
          <div
            className="font-display text-[0.9rem] tracking-[0.03em] uppercase leading-none"
            style={{ color }}
          >
            Featured hero
          </div>
          <div className="font-mono text-[0.48rem] text-[#888] uppercase tracking-[0.14em]">
            Position {spot.position} · Back of card
          </div>
          <div className="font-serif italic text-[0.64rem] text-[#ddd] leading-[1.2]">
            Your 20% of the back of 5,000 postcards. Ten-year lockout.
          </div>
        </div>
        <div className="bg-[#1a1a1a] rounded-[2px] flex flex-col items-center justify-center p-1 gap-[2px] min-h-0">
          <div
            className="font-display text-[1.3rem] leading-[0.95] text-center"
            style={{ color }}
          >
            OPEN
            <small className="block text-[0.65rem] text-white tracking-[0.05em]">
              SPOT
            </small>
          </div>
          <div className="font-mono text-[0.46rem] text-[#888] uppercase tracking-[0.14em] text-center">
            Available now
          </div>
        </div>
      </div>
    );
  }

  const offerParts = (spot.offer ?? "").split(" ");
  const headline = offerParts[0] ?? "";
  const rest = offerParts.slice(1).join(" ");
  return (
    <div className="bg-bg border border-[#2a2a2a] p-3 grid grid-cols-[1.2fr_1fr] gap-2 relative min-h-0 overflow-hidden">
      <div
        className="absolute top-0 right-0 font-mono text-[0.48rem] font-bold px-1.5 py-[2px] tracking-[0.14em] uppercase"
        style={{ background: color, color: "var(--bg)" }}
      >
        Featured
      </div>
      <div className="flex flex-col justify-between min-w-0 min-h-0 overflow-hidden">
        <div>
          <div className="font-display text-[0.9rem] tracking-[0.03em] uppercase text-white leading-none mb-1 truncate">
            {spot.business_name ?? "Reserved"}
          </div>
          <div className="font-mono text-[0.48rem] text-[#888] uppercase tracking-[0.14em] mb-1 truncate">
            Featured spot · {spot.status}
          </div>
          <div className="font-serif italic text-[0.64rem] text-[#ddd] leading-[1.2] line-clamp-3">
            {spot.offer ?? "Featured placement — back of postcard."}
          </div>
        </div>
        <div className="flex justify-between items-center font-mono text-[0.5rem] tracking-[0.09em] uppercase text-[#666] pt-1 border-t border-[#1f1f1f] gap-1">
          <span className="truncate">{spot.url ?? ""}</span>
          <span className="text-[0.58rem]" style={{ color }}>
            {(spot.phone ?? "").replace(/\D/g, "").slice(-4) || "—"}
          </span>
        </div>
      </div>
      <div className="bg-[#1a1a1a] rounded-[2px] flex flex-col items-center justify-center p-1 gap-[2px] min-h-0">
        <div
          className="font-display text-[1.4rem] leading-[0.95] text-center"
          style={{ color }}
        >
          {headline}
          <small className="block text-[0.7rem] text-white tracking-[0.05em]">
            {rest.split(" ")[0]?.toUpperCase() || "OFFER"}
          </small>
        </div>
        <div className="font-mono text-[0.46rem] text-[#888] uppercase tracking-[0.14em] text-center">
          Featured offer
        </div>
      </div>
    </div>
  );
}

function accentColor(accent: string): string {
  switch (accent) {
    case "red":
      return "var(--red)";
    case "amber":
      return "var(--amber)";
    case "teal":
      return "var(--teal)";
    case "pink":
      return "var(--pink)";
    case "orange":
      return "var(--orange)";
    default:
      return "var(--blue)";
  }
}

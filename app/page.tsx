import Link from "next/link";

// Placeholder root route. Milestone 2 replaces this with a real homepage.
// M1 only ships the single zone page — this exists so the domain loads.
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-6 h-6 bg-gradient-to-br from-blue to-red rotate-45 relative">
            <div className="absolute inset-[3px] bg-bg" />
          </div>
          <span className="font-display text-2xl tracking-[0.1em]">
            Darksteel Mail
          </span>
        </div>

        <div className="font-mono text-[0.72rem] tracking-[0.2em] uppercase text-blue mb-4">
          Zone 1 · Tonawanda East · May 2026
        </div>

        <h1 className="text-[clamp(2.2rem,5vw,3.5rem)] leading-[1] mb-6">
          Eight local businesses.
          <br />
          One postcard.
          <br />
          5,000 homes.
        </h1>

        <p className="font-body text-text-dim text-base mb-10 leading-relaxed">
          Curated shared-mail for Western New York. Ten spots per drop,
          one business per category, guaranteed exclusivity.
        </p>

        <Link
          href="/zones/tonawanda-east"
          className="inline-flex items-center gap-2 bg-blue text-bg font-body font-bold text-sm uppercase tracking-wide px-8 py-4 hover:shadow-blue-glow hover:-translate-y-0.5 transition-all duration-200"
        >
          See Zone 1 spots <span aria-hidden>→</span>
        </Link>
      </div>
    </main>
  );
}

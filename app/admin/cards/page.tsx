import Link from "next/link";
import { serviceClient } from "@/lib/supabase/server";
import { listZoneSummaries } from "@/lib/db/zones";

export const dynamic = "force-dynamic";

export default async function CardsListPage() {
  const zones = await listZoneSummaries(serviceClient());

  return (
    <div>
      <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-blue mb-3">
        Cards
      </div>
      <h1 className="font-display text-3xl tracking-[0.04em] uppercase mb-10">
        Your postcards
      </h1>

      {zones.length === 0 ? (
        <p className="font-body text-text-dim">
          No zones yet. Run <code className="text-blue">npm run db:reset</code>{" "}
          to load the seeded Tonawanda East zone, or insert a zone manually.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((z) => (
            <Link
              key={z.id}
              href={`/admin/cards/${z.id}`}
              className="block bg-panel border border-border hover:border-blue transition p-5"
            >
              <div className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-text-dim mb-2">
                ZIP {z.zip} · {dropLabel(z.drop_date)}
              </div>
              <div className="font-display text-xl tracking-[0.04em] mb-3">
                {z.name}
              </div>
              <div className="font-body text-sm text-text-dim">
                {z.household_count.toLocaleString()} households · {z.available_spots}/{z.total_spots} spots open
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function dropLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

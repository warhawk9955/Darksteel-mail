import Link from "next/link";
import { serviceClient } from "@/lib/supabase/server";
import { getPublicSiteConfig } from "@/lib/db/site_config";

export default async function AdminDashboardPage() {
  const config = await getPublicSiteConfig(serviceClient());
  const isPreLaunch = !config.launched_at;

  return (
    <div>
      <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-blue mb-3">
        {isPreLaunch ? "Pre-launch" : "Live"}
      </div>
      <h1 className="font-display text-3xl tracking-[0.04em] uppercase mb-4">
        Dashboard
      </h1>
      <p className="font-body text-text-dim max-w-xl leading-relaxed mb-10">
        Page views, unique visitors, form submissions, and conversion rate
        will land here in Phase 6.
      </p>

      {isPreLaunch ? (
        <div className="bg-panel border border-blue p-6 mb-10 max-w-2xl">
          <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-blue mb-3">
            Finish setup
          </div>
          <p className="font-body text-text-dim mb-4 leading-relaxed">
            Run through the wizard to fill out your site, choose a theme,
            and upload branding. You can edit anything later.
          </p>
          <Link
            href="/setup/name"
            className="inline-flex items-center gap-2 bg-blue text-bg font-body font-bold text-sm uppercase tracking-wide px-6 py-3 hover:shadow-blue-glow transition"
          >
            Start setup wizard <span aria-hidden>→</span>
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Placeholder label="Page Views" />
        <Placeholder label="Unique Visitors" />
        <Placeholder label="Form Submissions" />
        <Placeholder label="Conversion Rate" />
      </div>
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="border border-border bg-panel p-5">
      <div className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-text-faint mb-2">
        {label}
      </div>
      <div className="font-display text-3xl tracking-[0.04em] uppercase text-white leading-none mb-2">
        —
      </div>
      <div className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-text-dim">
        Coming in Phase 6
      </div>
    </div>
  );
}

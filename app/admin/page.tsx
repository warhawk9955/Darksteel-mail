export default function AdminDashboardPage() {
  return (
    <div>
      <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-blue mb-3">
        Phase 1 · Auth shell
      </div>
      <h1 className="font-display text-3xl tracking-[0.04em] uppercase mb-4">
        Dashboard
      </h1>
      <p className="font-body text-text-dim max-w-xl leading-relaxed mb-10">
        Page views, unique visitors, form submissions, and conversion rate
        will land here in Phase 6. The wizard arrives in Phase 3 at{" "}
        <code className="font-mono text-blue">/setup</code>.
      </p>

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

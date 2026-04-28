import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth/admin";

// Belt-and-braces: middleware already gates /admin, but this server
// component re-checks so a misconfigured matcher can't slip through.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAdminUser();
  if (!user) redirect("/login?next=/admin");

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r border-border bg-panel">
        <div className="px-6 py-6">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-5 h-5 bg-gradient-to-br from-blue to-red rotate-45 relative">
              <div className="absolute inset-[2px] bg-panel" />
            </div>
            <span className="font-display text-base tracking-[0.1em]">
              Darksteel Mail
            </span>
          </div>

          <nav className="flex flex-col gap-1">
            <NavLink href="/admin">Dashboard</NavLink>
            <NavLink href="/setup/name">Site Editor</NavLink>
            <NavLink href="/admin/cards">Cards</NavLink>
            <NavLink href="/admin/leads">Leads</NavLink>
            <NavLink href="/admin/account">Account &amp; Billing</NavLink>
            <NavLink href="/admin/help">Help &amp; Support</NavLink>
          </nav>

          <div className="mt-10 pt-6 border-t border-border">
            <Link
              href="/"
              target="_blank"
              className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-text-dim hover:text-blue transition"
            >
              View Live Site ↗
            </Link>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <div className="border-b border-border px-8 py-4 flex items-center justify-between">
          <div className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-text-dim">
            {user.email}
          </div>
          <form action="/api/admin/sign-out" method="post">
            <button
              type="submit"
              className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-text-dim hover:text-red transition"
            >
              Sign out
            </button>
          </form>
        </div>
        <div className="px-8 py-10">{children}</div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-2 font-body text-sm text-text-dim hover:text-white hover:bg-panel-2 transition"
    >
      {children}
    </Link>
  );
}

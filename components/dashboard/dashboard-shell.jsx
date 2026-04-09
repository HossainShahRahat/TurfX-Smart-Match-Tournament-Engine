import Link from "next/link";

import { roleMenus } from "@/services/role-menu.service";

export default function DashboardShell({
  title,
  subtitle,
  role,
  children,
}) {
  const menuItems = roleMenus[role] || [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.2),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_55%,_#111827_100%)] text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-light">
              TurfX SaaS
            </p>
            <h1 className="mt-3 text-2xl font-semibold">{title}</h1>
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          </div>

          <nav className="mt-8 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-2xl border border-transparent px-4 py-3 text-sm text-slate-200 transition hover:border-brand/50 hover:bg-brand/10"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur lg:p-6">
          {children}
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";

const setupSections = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/player", label: "Players" },
  { href: "/match", label: "Matches" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-brand/40 bg-brand/10 px-4 py-1 text-sm font-medium text-brand-light">
            Production-ready SaaS foundation
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            TurfX
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Cleanly structured Next.js foundation for turf match, player, and
            tournament management.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {setupSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-brand hover:bg-slate-900"
            >
              <h2 className="text-lg font-semibold text-white">{section.label}</h2>
              <p className="mt-2 text-sm text-slate-400">
                Placeholder route prepared for the next implementation step.
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

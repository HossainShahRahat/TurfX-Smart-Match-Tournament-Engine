import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { roleRouteMap } from "@/modules/dashboard/service";
import { getSessionUserFromCookies } from "@/utils/session";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const user = getSessionUserFromCookies(cookieStore);

  if (user?.role && roleRouteMap[user.role]) {
    redirect(roleRouteMap[user.role]);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-20 text-white">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-center shadow-2xl shadow-slate-950/40">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-light">
          Multi-role access
        </p>
        <h1 className="mt-4 text-4xl font-semibold">Dashboard Access</h1>
        <p className="mt-4 text-slate-300">
          Sign in and store your JWT in the `token` cookie to access the correct
          role dashboard automatically.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/dashboard/admin"
            className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-200 hover:border-brand/50"
          >
            Admin
          </Link>
          <Link
            href="/dashboard/turf"
            className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-200 hover:border-brand/50"
          >
            Turf Owner
          </Link>
          <Link
            href="/dashboard/player"
            className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-200 hover:border-brand/50"
          >
            Player
          </Link>
        </div>
      </div>
    </main>
  );
}

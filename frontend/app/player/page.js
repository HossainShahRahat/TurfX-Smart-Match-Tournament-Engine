import PlayerDirectoryClient from "@/components/player/player-directory-client";
import Link from "next/link";

export default function PlayerPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Players</h1>
          <p className="mt-4 text-slate-300">
            Browse public player profiles with skill, goals, peer ratings, and match history.
          </p>
        </div>
        <Link
          href="/scoreboard"
          className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-brand/40 hover:text-white"
        >
          Open Scoreboard
        </Link>
      </div>
      <PlayerDirectoryClient />
    </main>
  );
}

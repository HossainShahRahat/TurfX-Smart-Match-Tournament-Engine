import ScoreboardClient from "@/components/player/scoreboard-client";

export default function ScoreboardPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white">Scoreboard</h1>
      <p className="mt-4 max-w-3xl text-slate-300">
        Community ranking based on peer vote rating first, then skill and goal output.
        Open any player to see full profile details, match history, and highlight appearances.
      </p>
      <ScoreboardClient />
    </main>
  );
}

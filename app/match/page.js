export default function MatchPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white">Matches</h1>
      <p className="mt-4 text-slate-300">
        Open a live match at `/match/[id]` to subscribe to the real-time room,
        score feed, and event timeline.
      </p>
    </main>
  );
}

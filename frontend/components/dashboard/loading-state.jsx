export default function LoadingState({ label = "Loading dashboard..." }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
      <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
      <div className="mt-4 h-8 w-56 animate-pulse rounded-full bg-white/10" />
      <p className="mt-4 text-sm text-slate-400">{label}</p>
    </div>
  );
}

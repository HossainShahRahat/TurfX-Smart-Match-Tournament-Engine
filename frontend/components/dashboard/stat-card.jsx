export default function StatCard({ label, value, helper }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-3 text-3xl font-semibold text-white">{value}</h3>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </article>
  );
}

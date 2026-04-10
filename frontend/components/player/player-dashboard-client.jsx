"use client";

import { useState } from "react";

import { apiFetch } from "@/services/api-client";

export default function PlayerDashboardClient({ initialData }) {
  const [data] = useState(initialData);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [forms, setForms] = useState({});

  async function submitRatings(match) {
    const form = forms[match.id] || {};
    const ratings = match.remainingToRate.map((player) => ({
      ratedPlayerId: player.id,
      score: Number(form[player.id] || 0),
    }));

    if (ratings.some((entry) => !entry.score || entry.score < 1 || entry.score > 10)) {
      setError("Every visible player needs a rating from 1 to 10.");
      return;
    }

    setError("");
    setMessage("");

    const response = await apiFetch(`/api/match/${match.id}/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ratings }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.message || "Failed to submit ratings.");
      return;
    }

    setMessage(`Ratings submitted for ${match.title}. Refreshing dashboard...`);
    window.location.reload();
  }

  return (
    <div className="space-y-8">
      {message ? (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-2xl font-semibold">Recent Performances</h2>
          <div className="mt-4 space-y-3">
            {(data.recentPerformances || []).length ? (
              data.recentPerformances.map((match) => (
                <div key={match.id} className="rounded-2xl border border-white/10 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{match.title}</p>
                    <span className="text-sm uppercase tracking-[0.2em] text-brand-light">
                      {match.result}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {match.location} | {match.goals} goals | Vote rating{" "}
                    {match.averagePeerRating || 0}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No completed matches yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-2xl font-semibold">Pending Peer Ratings</h2>
          <div className="mt-4 space-y-4">
            {(data.pendingRatings || []).length ? (
              data.pendingRatings.map((match) => (
                <div key={match.id} className="rounded-2xl border border-white/10 p-4">
                  <p className="font-medium text-white">{match.title}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {match.teamALabel} {match.score.teamA} - {match.score.teamB}{" "}
                    {match.teamBLabel}
                  </p>
                  <div className="mt-4 grid gap-3">
                    {match.remainingToRate.map((player) => (
                      <label
                        key={player.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm"
                      >
                        <span>
                          {player.name}{" "}
                          <span className="text-slate-500">({player.team})</span>
                        </span>
                        <input
                          className="w-24 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2"
                          type="number"
                          min="1"
                          max="10"
                          value={forms[match.id]?.[player.id] || ""}
                          onChange={(event) =>
                            setForms((current) => ({
                              ...current,
                              [match.id]: {
                                ...(current[match.id] || {}),
                                [player.id]: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <button
                    className="mt-4 rounded-2xl bg-brand px-4 py-3 text-sm font-medium text-white hover:bg-brand-dark"
                    type="button"
                    onClick={() => submitRatings(match)}
                  >
                    Submit Ratings
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                No pending ratings. You&apos;re caught up.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-2xl font-semibold">Match History</h2>
        <div className="mt-4 space-y-3">
          {(data.matchHistory || []).length ? (
            data.matchHistory.map((match) => (
              <div key={match.id} className="rounded-2xl border border-white/10 px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{match.title}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {match.location} | {new Date(match.scheduledAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-slate-300">
                    {match.teamALabel} {match.score.teamA} - {match.score.teamB}{" "}
                    {match.teamBLabel}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No history available yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

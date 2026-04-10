"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/services/api-client";

function rankPlayers(players) {
  return [...players].sort((left, right) => {
    if ((right.averagePeerRating || 0) !== (left.averagePeerRating || 0)) {
      return (right.averagePeerRating || 0) - (left.averagePeerRating || 0);
    }

    if ((right.skillRating || 0) !== (left.skillRating || 0)) {
      return (right.skillRating || 0) - (left.skillRating || 0);
    }

    if ((right.totalGoals || 0) !== (left.totalGoals || 0)) {
      return (right.totalGoals || 0) - (left.totalGoals || 0);
    }

    return (left.name || "").localeCompare(right.name || "");
  });
}

export default function ScoreboardClient() {
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      const response = await apiFetch("/api/player", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        if (active) {
          setError(payload.message || "Failed to load scoreboard.");
        }
        return;
      }

      if (active) {
        setPlayers(rankPlayers(payload.data || []));
      }
    }

    loadPlayers();
    return () => {
      active = false;
    };
  }, []);

  const podium = useMemo(() => players.slice(0, 3), [players]);
  const tableRows = useMemo(() => players.slice(3), [players]);

  if (error) {
    return <p className="mt-6 text-sm text-rose-300">{error}</p>;
  }

  return (
    <div className="mt-8 space-y-8">
      <section className="grid gap-4 lg:grid-cols-3">
        {podium.map((player, index) => (
          <Link
            key={player.id}
            href={`/player/${player.id}`}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-6 transition hover:border-brand/40 hover:bg-brand/10"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-brand-light">
              Rank #{index + 1}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{player.name}</h2>
            <p className="mt-4 text-sm text-slate-300">
              Vote Rating {player.averagePeerRating || 0}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Skill {player.skillRating || 0} | Goals {player.totalGoals || 0} |
              Matches {player.totalMatches || 0}
            </p>
          </Link>
        ))}
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
        <div className="grid grid-cols-[80px_minmax(0,1.4fr)_130px_110px_110px_110px] gap-3 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.24em] text-slate-400">
          <span>Rank</span>
          <span>Player</span>
          <span>Vote Rating</span>
          <span>Skill</span>
          <span>Goals</span>
          <span>Matches</span>
        </div>

        <div className="divide-y divide-white/10">
          {[...podium, ...tableRows].map((player, index) => (
            <Link
              key={player.id}
              href={`/player/${player.id}`}
              className="grid grid-cols-[80px_minmax(0,1.4fr)_130px_110px_110px_110px] gap-3 px-5 py-4 text-sm transition hover:bg-white/5"
            >
              <span className="font-semibold text-brand-light">#{index + 1}</span>
              <span className="truncate text-white">{player.name}</span>
              <span className="text-slate-200">{player.averagePeerRating || 0}</span>
              <span className="text-slate-300">{player.skillRating || 0}</span>
              <span className="text-slate-300">{player.totalGoals || 0}</span>
              <span className="text-slate-300">{player.totalMatches || 0}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

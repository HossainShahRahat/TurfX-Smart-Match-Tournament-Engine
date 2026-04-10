"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch } from "@/services/api-client";

export default function PlayerDirectoryClient() {
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      const response = await apiFetch("/api/player", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok) {
        if (active) {
          setError(payload.message || "Failed to load players.");
        }
        return;
      }

      if (active) {
        setPlayers(payload.data || []);
      }
    }

    loadPlayers();
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return <p className="mt-6 text-sm text-rose-300">{error}</p>;
  }

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {players.map((player) => (
        <Link
          key={player.id}
          href={`/player/${player.id}`}
          className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-brand/40 hover:bg-brand/10"
        >
          <h2 className="text-xl font-semibold text-white">{player.name}</h2>
          <p className="mt-3 text-sm text-slate-400">
            Skill {player.skillRating || 0} | Goals {player.totalGoals || 0} | Matches{" "}
            {player.totalMatches || 0}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Vote rating {player.averagePeerRating || 0} | MOTM{" "}
            {player.manOfTheMatchCount || 0}
          </p>
        </Link>
      ))}
    </div>
  );
}

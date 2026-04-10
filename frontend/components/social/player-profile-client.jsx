"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "@/services/api-client";

export default function PlayerProfileClient({ playerId }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const response = await apiFetch(`/api/player/${playerId}/profile`, {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        if (active) {
          setError(payload.message || "Failed to load player profile.");
        }
        return;
      }

      if (active) {
        setProfile(payload.data);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [playerId]);

  if (error && !profile) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 text-white sm:px-6">
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-100">
          {error}
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 text-white sm:px-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-300">
          Loading player profile...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 text-white sm:px-6">
      <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_28%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.96))] p-6 shadow-2xl shadow-black/30">
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-brand-light">
              Player Profile
            </p>
            <h1 className="mt-3 text-4xl font-semibold">{profile.name}</h1>
            <p className="mt-3 text-sm text-slate-400">
              Public TurfX visibility page for player stats and highlights.
            </p>

            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-white/10 px-4 py-3">
                <p className="text-sm text-slate-400">Skill Rating</p>
                <h2 className="mt-2 text-3xl font-semibold">{profile.skillRating}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 px-4 py-3">
                  <p className="text-sm text-slate-400">Goals</p>
                  <h3 className="mt-2 text-2xl font-semibold">{profile.stats.goals}</h3>
                </div>
                <div className="rounded-2xl border border-white/10 px-4 py-3">
                  <p className="text-sm text-slate-400">Matches</p>
                  <h3 className="mt-2 text-2xl font-semibold">{profile.stats.matches}</h3>
                </div>
                <div className="rounded-2xl border border-white/10 px-4 py-3">
                  <p className="text-sm text-slate-400">Cards</p>
                  <h3 className="mt-2 text-2xl font-semibold">{profile.stats.cards}</h3>
                </div>
                <div className="rounded-2xl border border-white/10 px-4 py-3">
                  <p className="text-sm text-slate-400">Highlights</p>
                  <h3 className="mt-2 text-2xl font-semibold">
                    {profile.engagement.highlightAppearances}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-2xl font-semibold">Recent Highlights</h2>
              <div className="mt-4 space-y-3">
                {profile.highlights.map((post) => (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="block rounded-2xl border border-white/10 px-4 py-4 transition hover:border-brand/40 hover:bg-brand/10"
                  >
                    <p className="text-sm uppercase tracking-[0.2em] text-brand-light">
                      {post.type.replaceAll("_", " ")}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{post.title}</h3>
                    <p className="mt-2 text-sm text-slate-300">{post.content}</p>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-2xl font-semibold">Recent Match History</h2>
              <div className="mt-4 space-y-3">
                {profile.matchHistory.map((match) => (
                  <div
                    key={match.id}
                    className="rounded-2xl border border-white/10 px-4 py-3"
                  >
                    <p className="font-medium text-white">Match {match.id}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Status: {match.status}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

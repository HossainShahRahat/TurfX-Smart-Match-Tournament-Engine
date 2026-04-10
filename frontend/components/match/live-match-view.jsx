"use client";

import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { apiFetch } from "@/services/api-client";

function formatEventLabel(type) {
  return type
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatTimestamp(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TeamColumn({ title, side, score, players }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-light">
            {title}
          </p>
          <h2 className="mt-3 text-4xl font-semibold text-white">{score}</h2>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
          {side}
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {players.map((player) => (
          <div
            key={player.id}
            className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-white">{player.name}</p>
              <span className="text-sm text-slate-400">
                Skill {player.skillRating || 0}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Goals {player.totalGoals || 0} • Matches {player.totalMatches || 0}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LiveMatchView({ matchId }) {
  const [match, setMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionState, setConnectionState] = useState("connecting");
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMatch() {
      try {
        setIsLoading(true);
        const response = await apiFetch(`/api/match/${matchId}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || "Failed to load match.");
        }

        if (isMounted) {
          setMatch(payload.data);
          setError("");
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMatch();

    return () => {
      isMounted = false;
    };
  }, [matchId]);

  useEffect(() => {
    let isActive = true;
    let socket;

    async function connectSocket() {
      try {
        const response = await fetch("/api/runtime/socket", {
          cache: "no-store",
        });
        const payload = await response.json();

        socket = io(payload.url, {
          path: "/socket.io",
          withCredentials: true,
          transports: ["websocket", "polling"],
        });

        socket.on("connect", () => {
          if (!isActive) {
            return;
          }

          setConnectionState("connected");
          socket.emit("match:join", matchId);
        });

        socket.on("disconnect", () => {
          if (isActive) {
            setConnectionState("disconnected");
          }
        });

        socket.on("connect_error", () => {
          if (isActive) {
            setConnectionState("disconnected");
          }
        });

        socket.on("match:event", (payload) => {
          setLastEvent(payload.event || null);
          setMatch((currentMatch) => {
            if (!currentMatch) {
              return currentMatch;
            }

            const nextMatch = {
              ...currentMatch,
              score: payload.updatedScore,
              timeline: payload.updatedTimeline,
            };

            if (payload.updatedPlayer) {
              nextMatch.teamA = currentMatch.teamA.map((player) =>
                player.id === payload.updatedPlayer.id ? payload.updatedPlayer : player
              );
              nextMatch.teamB = currentMatch.teamB.map((player) =>
                player.id === payload.updatedPlayer.id ? payload.updatedPlayer : player
              );
            }

            return nextMatch;
          });
        });

        socket.on("match:state", (payload) => {
          setMatch((currentMatch) => {
            if (!currentMatch) {
              return currentMatch;
            }

            return {
              ...currentMatch,
              status: payload.status,
              score: payload.updatedScore,
              timeline: payload.updatedTimeline,
              teamA: payload.teamA || currentMatch.teamA,
              teamB: payload.teamB || currentMatch.teamB,
            };
          });
        });

        socket.on("player:updated", (payload) => {
          setMatch((currentMatch) => {
            if (!currentMatch || !payload?.player) {
              return currentMatch;
            }

            return {
              ...currentMatch,
              teamA: currentMatch.teamA.map((player) =>
                player.id === payload.player.id ? payload.player : player
              ),
              teamB: currentMatch.teamB.map((player) =>
                player.id === payload.player.id ? payload.player : player
              ),
            };
          });
        });
      } catch (socketError) {
        if (isActive) {
          setConnectionState("disconnected");
        }
      }
    }

    connectSocket();

    return () => {
      isActive = false;

      if (socket) {
        socket.emit("match:leave", matchId);
        socket.disconnect();
      }
    };
  }, [matchId]);

  const statusBadgeClass = useMemo(() => {
    if (connectionState === "connected") {
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
    }

    if (connectionState === "connecting") {
      return "border-amber-500/40 bg-amber-500/10 text-amber-200";
    }

    return "border-rose-500/40 bg-rose-500/10 text-rose-200";
  }, [connectionState]);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-slate-300">
        Loading live match...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-8 text-rose-100">
        {error}
      </div>
    );
  }

  if (!match) {
    return null;
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 text-white sm:px-6">
      <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.18),_transparent_30%),linear-gradient(180deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.96))] p-6 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-light">
              Live Match Broadcast
            </p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{match.title}</h1>
            <p className="mt-3 text-sm text-slate-400">
              {match.location} • {new Date(match.scheduledAt).toLocaleString()} • Status:{" "}
              <span className="font-medium text-slate-200">{match.status}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-4 py-2 text-sm ${statusBadgeClass}`}>
              {connectionState}
            </span>
            <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
              Score {match.score.teamA} - {match.score.teamB}
            </span>
          </div>
        </div>

        {lastEvent ? (
          <div className="mt-6 rounded-3xl border border-brand/20 bg-brand/10 p-4">
            <p className="text-sm text-brand-light">Latest update</p>
            <p className="mt-2 text-base text-white">
              {lastEvent.playerName || "Player"} • {formatEventLabel(lastEvent.type)} •{" "}
              {lastEvent.minute}'
            </p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 xl:grid-cols-[1fr_1fr_380px]">
          <TeamColumn
            title={match.teamALabel}
            side="Left"
            players={match.teamA}
            score={match.score.teamA}
          />
          <TeamColumn
            title={match.teamBLabel}
            side="Right"
            players={match.teamB}
            score={match.score.teamB}
          />

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-brand-light">
                  Timeline
                </p>
                <h2 className="mt-3 text-2xl font-semibold">Live Events</h2>
              </div>
              <span className="text-sm text-slate-400">
                {match.timeline.length} events
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {match.timeline.length ? (
                match.timeline.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">
                          {event.playerName || "Unknown Player"}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {formatEventLabel(event.type)} • {event.team}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold text-brand-light">
                          {event.minute}'
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatTimestamp(event.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">
                  No live events yet. Once the match starts, the broadcast feed will
                  update automatically.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

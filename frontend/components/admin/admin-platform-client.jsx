"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/services/api-client";

const initialPlayerForm = {
  name: "",
  email: "",
  username: "",
  password: "",
};

const initialMatchForm = {
  title: "",
  scheduledAt: "",
  location: "",
  teamALabel: "Team A",
  teamBLabel: "Team B",
  teamA: [],
  teamB: [],
};

const initialTournamentForm = {
  name: "",
  type: "league",
  teams: [
    { name: "Team 1", group: "A", playerIds: [] },
    { name: "Team 2", group: "A", playerIds: [] },
  ],
};

function EmptyState({ label }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
      {label}
    </div>
  );
}

function formatDateTime(value) {
  if (!value) {
    return "Not scheduled yet";
  }

  return new Date(value).toLocaleString();
}

function normalizeMatchForm(match) {
  return {
    title: match.title || "",
    scheduledAt: match.scheduledAt
      ? new Date(match.scheduledAt).toISOString().slice(0, 16)
      : "",
    location: match.location || "",
    teamALabel: match.teamALabel || "Team A",
    teamBLabel: match.teamBLabel || "Team B",
    teamA: (match.teamA || []).map((player) => player.id),
    teamB: (match.teamB || []).map((player) => player.id),
  };
}

function summarizeTournamentMatches(tournament) {
  return tournament.matchDetails?.length || tournament.matches?.length || 0;
}

function PlayerToggleList({ players, selectedIds, onToggle, blockedIds = [] }) {
  const blocked = new Set(blockedIds);

  return (
    <div className="grid max-h-56 gap-2 overflow-auto rounded-2xl border border-white/10 bg-slate-950/40 p-3">
      {players.map((player) => {
        const active = selectedIds.includes(player.id);
        const disabled = blocked.has(player.id);

        return (
          <button
            key={player.id}
            type="button"
            onClick={() => !disabled && onToggle(player.id)}
            className={`rounded-2xl border px-3 py-2 text-left text-sm transition ${
              active
                ? "border-brand/60 bg-brand/15 text-white"
                : disabled
                  ? "cursor-not-allowed border-white/5 bg-white/5 text-slate-500"
                  : "border-white/10 bg-white/5 text-slate-200 hover:border-brand/30"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{player.name}</span>
              <span className="text-xs text-slate-400">
                Skill {player.skillRating || 0}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TournamentTeamCard({
  index,
  team,
  type,
  players,
  blockedIds,
  onChange,
  onTogglePlayer,
  onRemove,
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">Tournament Team {index + 1}</h3>
        <button
          type="button"
          className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 hover:border-rose-400/40 hover:text-rose-200"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <input
          className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
          placeholder="Team name"
          value={team.name}
          onChange={(event) => onChange("name", event.target.value)}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
            placeholder="Seed (optional)"
            type="number"
            min="1"
            value={team.seed || ""}
            onChange={(event) => onChange("seed", event.target.value)}
          />
          <input
            className={`rounded-2xl border px-4 py-3 ${
              type === "hybrid"
                ? "border-white/10 bg-slate-950/50"
                : "border-white/5 bg-slate-950/30 text-slate-500"
            }`}
            placeholder="Group"
            value={type === "hybrid" ? team.group || "" : ""}
            disabled={type !== "hybrid"}
            onChange={(event) => onChange("group", event.target.value)}
          />
        </div>
        <PlayerToggleList
          players={players}
          selectedIds={team.playerIds}
          blockedIds={blockedIds}
          onToggle={onTogglePlayer}
        />
      </div>
    </div>
  );
}

export default function AdminPlatformClient() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [playerForm, setPlayerForm] = useState(initialPlayerForm);
  const [matchForm, setMatchForm] = useState(initialMatchForm);
  const [tournamentForm, setTournamentForm] = useState(initialTournamentForm);
  const [editingMatchId, setEditingMatchId] = useState("");
  const [editForms, setEditForms] = useState({});
  const [eventForms, setEventForms] = useState({});
  const [scoreForms, setScoreForms] = useState({});

  async function parseJson(response) {
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || "Request failed.");
    }
    return payload.data;
  }

  async function loadData() {
    try {
      setLoading(true);

      const [playersResponse, matchesResponse, tournamentsResponse] = await Promise.all([
        apiFetch("/api/admin/players", { cache: "no-store" }),
        apiFetch("/api/match", { cache: "no-store" }),
        apiFetch("/api/tournament", { cache: "no-store" }),
      ]);

      const playersPayload = await parseJson(playersResponse);
      const matchesPayload = await parseJson(matchesResponse);
      const tournamentsPayload = await parseJson(tournamentsResponse);

      setPlayers(playersPayload.rows || []);
      setMatches(matchesPayload || []);
      setTournaments(tournamentsPayload || []);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const sortedMatches = useMemo(
    () =>
      [...matches].sort(
        (left, right) => new Date(right.scheduledAt || 0) - new Date(left.scheduledAt || 0)
      ),
    [matches]
  );

  function clearFeedback() {
    setMessage("");
    setError("");
  }

  function toggleTeamSelection(formKey, teamKey, playerId) {
    if (formKey === "match") {
      setMatchForm((current) => {
        const selected = current[teamKey];
        const nextSelected = selected.includes(playerId)
          ? selected.filter((id) => id !== playerId)
          : [...selected, playerId];

        return {
          ...current,
          [teamKey]: nextSelected,
        };
      });
      return;
    }

    setEditForms((current) => {
      const form = current[formKey];
      const selected = form[teamKey];
      const nextSelected = selected.includes(playerId)
        ? selected.filter((id) => id !== playerId)
        : [...selected, playerId];

      return {
        ...current,
        [formKey]: {
          ...form,
          [teamKey]: nextSelected,
        },
      };
    });
  }

  function updateTournamentTeam(index, key, value) {
    setTournamentForm((current) => ({
      ...current,
      teams: current.teams.map((team, teamIndex) =>
        teamIndex === index
          ? {
              ...team,
              [key]: value,
            }
          : team
      ),
    }));
  }

  function toggleTournamentPlayer(teamIndex, playerId) {
    setTournamentForm((current) => ({
      ...current,
      teams: current.teams.map((team, index) => {
        if (index !== teamIndex) {
          return team;
        }

        return {
          ...team,
          playerIds: team.playerIds.includes(playerId)
            ? team.playerIds.filter((id) => id !== playerId)
            : [...team.playerIds, playerId],
        };
      }),
    }));
  }

  function addTournamentTeam() {
    setTournamentForm((current) => ({
      ...current,
      teams: [
        ...current.teams,
        {
          name: `Team ${current.teams.length + 1}`,
          group: current.type === "hybrid" ? "A" : "",
          playerIds: [],
        },
      ],
    }));
  }

  function removeTournamentTeam(index) {
    setTournamentForm((current) => {
      if (current.teams.length <= 2) {
        return current;
      }

      return {
        ...current,
        teams: current.teams.filter((_, teamIndex) => teamIndex !== index),
      };
    });
  }

  async function handleCreatePlayer(event) {
    event.preventDefault();
    clearFeedback();

    try {
      const response = await apiFetch("/api/admin/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playerForm),
      });
      const created = await parseJson(response);
      setMessage(
        `Player account created for ${created.name}. Username: ${created.username}`
      );
      setPlayerForm(initialPlayerForm);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleCreateMatch(event) {
    event.preventDefault();
    clearFeedback();

    try {
      const response = await apiFetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchForm),
      });
      const created = await parseJson(response);
      setMessage(`Match created: ${created.title}`);
      setMatchForm(initialMatchForm);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleCreateTournament(event) {
    event.preventDefault();
    clearFeedback();

    try {
      const payload = {
        name: tournamentForm.name,
        type: tournamentForm.type,
        teams: tournamentForm.teams.map((team, index) => ({
          name: team.name,
          playerIds: team.playerIds,
          group: tournamentForm.type === "hybrid" ? team.group : undefined,
          seed: team.seed ? Number(team.seed) : index + 1,
        })),
      };

      const response = await apiFetch("/api/tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const created = await parseJson(response);
      setMessage(`Tournament created: ${created.name}`);
      setTournamentForm(initialTournamentForm);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function generateTournamentFixtures(tournamentId) {
    clearFeedback();

    try {
      const response = await apiFetch("/api/tournament/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournamentId }),
      });
      const tournament = await parseJson(response);
      setMessage(
        `Fixtures generated for ${tournament.name}. Tournament matches are now available in the match manager.`
      );
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function updateMatchStatus(matchId, status) {
    clearFeedback();

    try {
      const response = await apiFetch(`/api/match/${matchId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await parseJson(response);
      setMessage(`Match status changed to ${status}.`);
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function submitEvent(matchId) {
    const form = eventForms[matchId];
    if (!form?.playerId) {
      setError("Choose a player before adding an event.");
      return;
    }

    clearFeedback();

    try {
      const response = await apiFetch("/api/match/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          playerId: form.playerId,
          type: form.type || "goal",
          minute: Number(form.minute || 0),
        }),
      });
      await parseJson(response);
      setMessage("Match event recorded.");
      setEventForms((current) => ({
        ...current,
        [matchId]: { playerId: "", type: "goal", minute: 0 },
      }));
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function submitScore(matchId) {
    const form = scoreForms[matchId];
    clearFeedback();

    try {
      const response = await apiFetch(`/api/match/${matchId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamA: Number(form?.teamA || 0),
          teamB: Number(form?.teamB || 0),
        }),
      });
      await parseJson(response);
      setMessage("Official score updated.");
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function submitMatchEdit(matchId) {
    const form = editForms[matchId];
    if (!form) {
      return;
    }

    clearFeedback();

    try {
      const response = await apiFetch(`/api/match/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const updated = await parseJson(response);
      setMessage(`Fixture updated: ${updated.title}`);
      setEditingMatchId("");
      await loadData();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function openEditMatch(match) {
    setEditingMatchId(match.id);
    setEditForms((current) => ({
      ...current,
      [match.id]: normalizeMatchForm(match),
    }));
  }

  return (
    <div className="mt-8 space-y-8">
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

      <section className="grid gap-6 xl:grid-cols-2">
        <form
          onSubmit={handleCreatePlayer}
          className="rounded-3xl border border-white/10 bg-white/5 p-5"
        >
          <h2 className="text-2xl font-semibold">Create Player Account</h2>
          <p className="mt-2 text-sm text-slate-400">
            Create login credentials for a player, then manage them as part of matches
            and tournaments.
          </p>
          <div className="mt-5 grid gap-3">
            <input
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
              placeholder="Player name"
              value={playerForm.name}
              onChange={(event) =>
                setPlayerForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <input
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
              placeholder="Email"
              value={playerForm.email}
              onChange={(event) =>
                setPlayerForm((current) => ({ ...current, email: event.target.value }))
              }
            />
            <input
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
              placeholder="Username"
              value={playerForm.username}
              onChange={(event) =>
                setPlayerForm((current) => ({ ...current, username: event.target.value }))
              }
            />
            <input
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
              placeholder="Initial password"
              type="password"
              value={playerForm.password}
              onChange={(event) =>
                setPlayerForm((current) => ({ ...current, password: event.target.value }))
              }
            />
            <button
              className="rounded-2xl bg-brand px-4 py-3 font-medium text-white transition hover:bg-brand-dark"
              type="submit"
            >
              Create Player
            </button>
          </div>
        </form>

        <form
          onSubmit={handleCreateMatch}
          className="rounded-3xl border border-white/10 bg-white/5 p-5"
        >
          <h2 className="text-2xl font-semibold">Create Team vs Team Fixture</h2>
          <p className="mt-2 text-sm text-slate-400">
            Schedule standalone fixtures that can later be started live, edited, and
            scored.
          </p>
          <div className="mt-5 grid gap-3">
            <input
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
              placeholder="Match title"
              value={matchForm.title}
              onChange={(event) =>
                setMatchForm((current) => ({ ...current, title: event.target.value }))
              }
            />
            <input
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
              type="datetime-local"
              value={matchForm.scheduledAt}
              onChange={(event) =>
                setMatchForm((current) => ({
                  ...current,
                  scheduledAt: event.target.value,
                }))
              }
            />
            <input
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
              placeholder="Location / Turf"
              value={matchForm.location}
              onChange={(event) =>
                setMatchForm((current) => ({ ...current, location: event.target.value }))
              }
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
                placeholder="Team A label"
                value={matchForm.teamALabel}
                onChange={(event) =>
                  setMatchForm((current) => ({
                    ...current,
                    teamALabel: event.target.value,
                  }))
                }
              />
              <input
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
                placeholder="Team B label"
                value={matchForm.teamBLabel}
                onChange={(event) =>
                  setMatchForm((current) => ({
                    ...current,
                    teamBLabel: event.target.value,
                  }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm text-slate-300">{matchForm.teamALabel}</p>
                <PlayerToggleList
                  players={players}
                  selectedIds={matchForm.teamA}
                  blockedIds={matchForm.teamB}
                  onToggle={(playerId) =>
                    toggleTeamSelection("match", "teamA", playerId)
                  }
                />
              </div>
              <div>
                <p className="mb-2 text-sm text-slate-300">{matchForm.teamBLabel}</p>
                <PlayerToggleList
                  players={players}
                  selectedIds={matchForm.teamB}
                  blockedIds={matchForm.teamA}
                  onToggle={(playerId) =>
                    toggleTeamSelection("match", "teamB", playerId)
                  }
                />
              </div>
            </div>

            <button
              className="rounded-2xl bg-brand px-4 py-3 font-medium text-white transition hover:bg-brand-dark"
              type="submit"
            >
              Create Fixture
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Tournament Control</h2>
            <p className="mt-2 text-sm text-slate-400">
              Create league, knockout, or hybrid tournaments, assign players into
              tournament teams, and generate fixtures.
            </p>
          </div>
          <Link
            href="/scoreboard"
            className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-brand/40 hover:text-white"
          >
            Open Scoreboard
          </Link>
        </div>

        <form onSubmit={handleCreateTournament} className="mt-5 space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <input
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
              placeholder="Tournament name"
              value={tournamentForm.name}
              onChange={(event) =>
                setTournamentForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <select
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
              value={tournamentForm.type}
              onChange={(event) =>
                setTournamentForm((current) => ({
                  ...current,
                  type: event.target.value,
                  teams: current.teams.map((team) => ({
                    ...team,
                    group: event.target.value === "hybrid" ? team.group || "A" : "",
                  })),
                }))
              }
            >
              <option value="league">League</option>
              <option value="knockout">Knockout</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {tournamentForm.teams.map((team, index) => {
              const blockedIds = tournamentForm.teams.flatMap((entry, entryIndex) =>
                entryIndex === index ? [] : entry.playerIds
              );

              return (
                <TournamentTeamCard
                  key={`${team.name}-${index}`}
                  index={index}
                  team={team}
                  type={tournamentForm.type}
                  players={players}
                  blockedIds={blockedIds}
                  onChange={(key, value) => updateTournamentTeam(index, key, value)}
                  onTogglePlayer={(playerId) => toggleTournamentPlayer(index, playerId)}
                  onRemove={() => removeTournamentTeam(index)}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:border-brand/40"
              onClick={addTournamentTeam}
            >
              Add Tournament Team
            </button>
            <button
              className="rounded-2xl bg-brand px-4 py-3 font-medium text-white transition hover:bg-brand-dark"
              type="submit"
            >
              Create Tournament
            </button>
          </div>
        </form>

        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold text-white">Existing Tournaments</h3>
          {loading ? <EmptyState label="Loading tournaments..." /> : null}
          {!loading && !tournaments.length ? (
            <EmptyState label="No tournaments created yet." />
          ) : null}
          {!loading
            ? tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="rounded-3xl border border-white/10 bg-slate-950/40 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h4 className="text-xl font-semibold text-white">{tournament.name}</h4>
                      <p className="mt-2 text-sm text-slate-400">
                        {tournament.type} tournament with {tournament.teams?.length || 0} teams
                        and {summarizeTournamentMatches(tournament)} fixtures.
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-brand-light">
                        {tournament.status}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-white/10 px-4 py-2 text-sm hover:border-brand/50"
                        onClick={() => generateTournamentFixtures(tournament.id)}
                      >
                        Generate Fixtures
                      </button>
                      <Link
                        href="/feed"
                        className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-brand/50"
                      >
                        Social Feed
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {(tournament.teams || []).map((team) => (
                      <div
                        key={team.id}
                        className="rounded-2xl border border-white/10 px-4 py-3"
                      >
                        <p className="font-medium text-white">{team.name}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          Players: {team.playerIds?.length || 0}
                          {team.group ? ` | Group ${team.group}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            : null}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-2xl font-semibold">Match Management</h2>
        <p className="mt-2 text-sm text-slate-400">
          Edit pending fixtures, start matches live, add events, adjust official score,
          and finish fixtures so players can rate each other afterward.
        </p>

        <div className="mt-5 space-y-4">
          {loading ? <EmptyState label="Loading admin workspace..." /> : null}
          {!loading && !sortedMatches.length ? (
            <EmptyState label="No matches created yet." />
          ) : null}

          {!loading
            ? sortedMatches.map((match) => {
                const eventForm = eventForms[match.id] || {
                  playerId: "",
                  type: "goal",
                  minute: 0,
                };
                const scoreForm = scoreForms[match.id] || {
                  teamA: match.score?.teamA || 0,
                  teamB: match.score?.teamB || 0,
                };
                const participants = [...(match.teamA || []), ...(match.teamB || [])];
                const editForm = editForms[match.id] || normalizeMatchForm(match);
                const isEditing = editingMatchId === match.id;

                return (
                  <div
                    key={match.id}
                    className="rounded-3xl border border-white/10 bg-slate-950/40 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-white">{match.title}</h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {match.location} | {formatDateTime(match.scheduledAt)}
                        </p>
                        <p className="mt-2 text-sm text-slate-300">
                          {match.teamALabel} {match.score?.teamA || 0} -{" "}
                          {match.score?.teamB || 0} {match.teamBLabel}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-brand-light">
                          {match.status}
                          {match.tournamentId ? " | Tournament Fixture" : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {match.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              className="rounded-full border border-white/10 px-4 py-2 text-sm hover:border-brand/50"
                              onClick={() =>
                                isEditing ? setEditingMatchId("") : openEditMatch(match)
                              }
                            >
                              {isEditing ? "Close Edit" : "Edit Fixture"}
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-white/10 px-4 py-2 text-sm hover:border-brand/50"
                              onClick={() => updateMatchStatus(match.id, "live")}
                            >
                              Start Match
                            </button>
                          </>
                        ) : null}
                        {match.status !== "finished" ? (
                          <button
                            type="button"
                            className="rounded-full border border-white/10 px-4 py-2 text-sm hover:border-brand/50"
                            onClick={() => updateMatchStatus(match.id, "finished")}
                          >
                            Mark Complete
                          </button>
                        ) : null}
                        <Link
                          href={`/match/${match.id}`}
                          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-brand/50"
                        >
                          Open Live View
                        </Link>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-medium text-slate-200">
                          Edit Pending Fixture
                        </p>
                        <div className="mt-4 grid gap-3">
                          <input
                            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                            placeholder="Match title"
                            value={editForm.title}
                            onChange={(event) =>
                              setEditForms((current) => ({
                                ...current,
                                [match.id]: {
                                  ...editForm,
                                  title: event.target.value,
                                },
                              }))
                            }
                          />
                          <div className="grid gap-3 lg:grid-cols-2">
                            <input
                              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                              type="datetime-local"
                              value={editForm.scheduledAt}
                              onChange={(event) =>
                                setEditForms((current) => ({
                                  ...current,
                                  [match.id]: {
                                    ...editForm,
                                    scheduledAt: event.target.value,
                                  },
                                }))
                              }
                            />
                            <input
                              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                              placeholder="Location"
                              value={editForm.location}
                              onChange={(event) =>
                                setEditForms((current) => ({
                                  ...current,
                                  [match.id]: {
                                    ...editForm,
                                    location: event.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="grid gap-3 lg:grid-cols-2">
                            <input
                              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                              placeholder="Team A label"
                              value={editForm.teamALabel}
                              onChange={(event) =>
                                setEditForms((current) => ({
                                  ...current,
                                  [match.id]: {
                                    ...editForm,
                                    teamALabel: event.target.value,
                                  },
                                }))
                              }
                            />
                            <input
                              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                              placeholder="Team B label"
                              value={editForm.teamBLabel}
                              onChange={(event) =>
                                setEditForms((current) => ({
                                  ...current,
                                  [match.id]: {
                                    ...editForm,
                                    teamBLabel: event.target.value,
                                  },
                                }))
                              }
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="mb-2 text-sm text-slate-300">{editForm.teamALabel}</p>
                              <PlayerToggleList
                                players={players}
                                selectedIds={editForm.teamA}
                                blockedIds={editForm.teamB}
                                onToggle={(playerId) =>
                                  toggleTeamSelection(match.id, "teamA", playerId)
                                }
                              />
                            </div>
                            <div>
                              <p className="mb-2 text-sm text-slate-300">{editForm.teamBLabel}</p>
                              <PlayerToggleList
                                players={players}
                                selectedIds={editForm.teamB}
                                blockedIds={editForm.teamA}
                                onToggle={(playerId) =>
                                  toggleTeamSelection(match.id, "teamB", playerId)
                                }
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              className="rounded-2xl bg-brand px-4 py-3 text-sm font-medium text-white hover:bg-brand-dark"
                              onClick={() => submitMatchEdit(match.id)}
                            >
                              Save Fixture Changes
                            </button>
                            <button
                              type="button"
                              className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:border-white/20"
                              onClick={() => setEditingMatchId("")}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-medium text-slate-200">Record Event</p>
                        <div className="mt-3 grid gap-3">
                          <select
                            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                            value={eventForm.playerId}
                            onChange={(event) =>
                              setEventForms((current) => ({
                                ...current,
                                [match.id]: {
                                  ...eventForm,
                                  playerId: event.target.value,
                                },
                              }))
                            }
                          >
                            <option value="">Select player</option>
                            {participants.map((player) => (
                              <option key={player.id} value={player.id}>
                                {player.name}
                              </option>
                            ))}
                          </select>
                          <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                            <select
                              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                              value={eventForm.type}
                              onChange={(event) =>
                                setEventForms((current) => ({
                                  ...current,
                                  [match.id]: {
                                    ...eventForm,
                                    type: event.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="goal">Goal</option>
                              <option value="yellow_card">Yellow Card</option>
                              <option value="red_card">Red Card</option>
                              <option value="substitution">Substitution</option>
                            </select>
                            <input
                              className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                              type="number"
                              min="0"
                              value={eventForm.minute}
                              onChange={(event) =>
                                setEventForms((current) => ({
                                  ...current,
                                  [match.id]: {
                                    ...eventForm,
                                    minute: event.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                          <button
                            type="button"
                            className="rounded-2xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-white hover:bg-brand/20"
                            onClick={() => submitEvent(match.id)}
                          >
                            Save Event
                          </button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm font-medium text-slate-200">
                          Adjust Official Score
                        </p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <input
                            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                            type="number"
                            min="0"
                            value={scoreForm.teamA}
                            onChange={(event) =>
                              setScoreForms((current) => ({
                                ...current,
                                [match.id]: {
                                  ...scoreForm,
                                  teamA: event.target.value,
                                },
                              }))
                            }
                          />
                          <input
                            className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3"
                            type="number"
                            min="0"
                            value={scoreForm.teamB}
                            onChange={(event) =>
                              setScoreForms((current) => ({
                                ...current,
                                [match.id]: {
                                  ...scoreForm,
                                  teamB: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <button
                          type="button"
                          className="mt-3 rounded-2xl border border-white/10 px-4 py-3 text-sm hover:border-brand/50"
                          onClick={() => submitScore(match.id)}
                        >
                          Update Score
                        </button>
                        {match.manOfTheMatch ? (
                          <p className="mt-4 text-sm text-slate-300">
                            Man of the match:{" "}
                            <span className="font-medium text-white">
                              {match.manOfTheMatch.name}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            : null}
        </div>
      </section>
    </div>
  );
}

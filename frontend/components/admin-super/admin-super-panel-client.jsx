"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/services/api-client";

const SECTIONS = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "matches", label: "Matches" },
  { key: "tournaments", label: "Tournaments" },
  { key: "moderation", label: "Content moderation" },
  { key: "settings", label: "System settings" },
  { key: "notifications", label: "Notifications" },
];

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function ConfirmModal({ open, title, description, confirmLabel, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl shadow-black/40">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/10 px-5 py-2 text-sm text-slate-200 hover:border-slate-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-rose-500/30 bg-rose-500/10 px-5 py-2 text-sm text-rose-100 hover:border-rose-400"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, helper }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <h3 className="mt-3 text-3xl font-semibold text-white">{value}</h3>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </article>
  );
}

function Table({ columns, rows, emptyMessage, actions }) {
  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 p-8 text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-medium">
                  {column.label}
                </th>
              ))}
              {actions ? <th className="px-4 py-3 font-medium">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr key={row.id || row.key} className="text-slate-200">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 align-top">
                    {row[column.key] ?? "-"}
                  </td>
                ))}
                {actions ? (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">{actions(row)}</div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return { success: false, message: "Invalid server response.", data: null };
  }
}

export default function AdminSuperPanelClient() {
  const [section, setSection] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");

  const [usersState, setUsersState] = useState({ loading: false, page: 1, q: "", status: "", role: "", data: null });
  const [matchesState, setMatchesState] = useState({ loading: false, page: 1, data: null });
  const [tournamentsState, setTournamentsState] = useState({ loading: false, page: 1, data: null });
  const [postsState, setPostsState] = useState({ loading: false, page: 1, q: "", data: null });
  const [settingsState, setSettingsState] = useState({ loading: false, page: 1, q: "", data: null, key: "", value: "" });

  const [confirm, setConfirm] = useState({ open: false, title: "", description: "", label: "", run: null });

  const sidebarItems = useMemo(() => SECTIONS, []);

  useEffect(() => {
    let active = true;
    async function loadOverview() {
      const response = await apiFetch("/api/admin/super/overview", { cache: "no-store" });
      const payload = await safeJson(response);
      if (!response.ok) {
        if (active) setError(payload.message || "Failed to load overview.");
        return;
      }
      if (active) {
        setOverview(payload.data);
        setError("");
      }
    }
    loadOverview();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (section !== "users") return;
    let active = true;

    async function loadUsers() {
      setUsersState((s) => ({ ...s, loading: true }));
      const params = new URLSearchParams();
      params.set("page", String(usersState.page));
      params.set("limit", "20");
      if (usersState.q) params.set("q", usersState.q);
      if (usersState.status) params.set("status", usersState.status);
      if (usersState.role) params.set("role", usersState.role);

      const response = await apiFetch(`/api/admin/users?${params.toString()}`, { cache: "no-store" });
      const payload = await safeJson(response);
      if (!response.ok) {
        if (active) setError(payload.message || "Failed to load users.");
      } else if (active) {
        setUsersState((s) => ({ ...s, data: payload.data }));
        setError("");
      }
      if (active) setUsersState((s) => ({ ...s, loading: false }));
    }

    loadUsers();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, usersState.page]);

  useEffect(() => {
    if (section !== "matches") return;
    let active = true;
    async function loadMatches() {
      setMatchesState((s) => ({ ...s, loading: true }));
      const response = await apiFetch(`/api/admin/matches?page=${matchesState.page}&limit=20`, { cache: "no-store" });
      const payload = await safeJson(response);
      if (!response.ok) {
        if (active) setError(payload.message || "Failed to load matches.");
      } else if (active) {
        setMatchesState((s) => ({ ...s, data: payload.data }));
        setError("");
      }
      if (active) setMatchesState((s) => ({ ...s, loading: false }));
    }
    loadMatches();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, matchesState.page]);

  useEffect(() => {
    if (section !== "tournaments") return;
    let active = true;
    async function loadTournaments() {
      setTournamentsState((s) => ({ ...s, loading: true }));
      const response = await apiFetch(`/api/admin/tournaments?page=${tournamentsState.page}&limit=20`, { cache: "no-store" });
      const payload = await safeJson(response);
      if (!response.ok) {
        if (active) setError(payload.message || "Failed to load tournaments.");
      } else if (active) {
        setTournamentsState((s) => ({ ...s, data: payload.data }));
        setError("");
      }
      if (active) setTournamentsState((s) => ({ ...s, loading: false }));
    }
    loadTournaments();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, tournamentsState.page]);

  useEffect(() => {
    if (section !== "moderation") return;
    let active = true;
    async function loadPosts() {
      setPostsState((s) => ({ ...s, loading: true }));
      const params = new URLSearchParams();
      params.set("page", String(postsState.page));
      params.set("limit", "20");
      if (postsState.q) params.set("q", postsState.q);

      const response = await apiFetch(`/api/admin/posts?${params.toString()}`, { cache: "no-store" });
      const payload = await safeJson(response);
      if (!response.ok) {
        if (active) setError(payload.message || "Failed to load posts.");
      } else if (active) {
        setPostsState((s) => ({ ...s, data: payload.data }));
        setError("");
      }
      if (active) setPostsState((s) => ({ ...s, loading: false }));
    }
    loadPosts();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, postsState.page]);

  useEffect(() => {
    if (section !== "settings") return;
    let active = true;
    async function loadSettings() {
      setSettingsState((s) => ({ ...s, loading: true }));
      const params = new URLSearchParams();
      params.set("page", String(settingsState.page));
      params.set("limit", "20");
      if (settingsState.q) params.set("q", settingsState.q);

      const response = await apiFetch(`/api/admin/settings?${params.toString()}`, { cache: "no-store" });
      const payload = await safeJson(response);
      if (!response.ok) {
        if (active) setError(payload.message || "Failed to load settings.");
      } else if (active) {
        setSettingsState((s) => ({ ...s, data: payload.data }));
        setError("");
      }
      if (active) setSettingsState((s) => ({ ...s, loading: false }));
    }
    loadSettings();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, settingsState.page]);

  async function runAction(run) {
    try {
      const result = await run();
      if (!result.ok) {
        setError(result.message || "Action failed.");
      } else {
        setError("");
      }
    } catch (actionError) {
      setError(actionError.message || "Action failed.");
    }
  }

  function openConfirm({ title, description, label, run }) {
    setConfirm({ open: true, title, description, label, run });
  }

  async function suspendUser(userId) {
    const response = await apiFetch("/api/admin/users/suspend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const payload = await safeJson(response);
    if (response.ok) {
      setUsersState((s) => ({ ...s, page: 1 }));
    }
    return { ok: response.ok, message: payload.message };
  }

  async function activateUser(userId) {
    const response = await apiFetch("/api/admin/users/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const payload = await safeJson(response);
    if (response.ok) {
      setUsersState((s) => ({ ...s, page: 1 }));
    }
    return { ok: response.ok, message: payload.message };
  }

  async function deleteMatch(matchId) {
    const response = await apiFetch(`/api/admin/match?matchId=${matchId}`, { method: "DELETE" });
    const payload = await safeJson(response);
    if (response.ok) setMatchesState((s) => ({ ...s, page: 1 }));
    return { ok: response.ok, message: payload.message };
  }

  async function resetMatch(matchId) {
    const response = await apiFetch("/api/admin/match/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    });
    const payload = await safeJson(response);
    if (response.ok) setMatchesState((s) => ({ ...s, page: 1 }));
    return { ok: response.ok, message: payload.message };
  }

  async function forceMatchStatus(matchId, status) {
    const response = await apiFetch("/api/admin/match/force-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, status }),
    });
    const payload = await safeJson(response);
    if (response.ok) setMatchesState((s) => ({ ...s, page: 1 }));
    return { ok: response.ok, message: payload.message };
  }

  async function closeTournament(tournamentId) {
    const response = await apiFetch("/api/admin/tournament/force-close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId }),
    });
    const payload = await safeJson(response);
    if (response.ok) setTournamentsState((s) => ({ ...s, page: 1 }));
    return { ok: response.ok, message: payload.message };
  }

  async function resetTournament(tournamentId) {
    const response = await apiFetch("/api/admin/tournament/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId }),
    });
    const payload = await safeJson(response);
    if (response.ok) setTournamentsState((s) => ({ ...s, page: 1 }));
    return { ok: response.ok, message: payload.message };
  }

  async function deletePost(postId) {
    const response = await apiFetch(`/api/admin/post?postId=${postId}`, { method: "DELETE" });
    const payload = await safeJson(response);
    if (response.ok) setPostsState((s) => ({ ...s, page: 1 }));
    return { ok: response.ok, message: payload.message };
  }

  async function togglePinPost(postId, pinned) {
    const response = await apiFetch("/api/admin/post/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, pinned }),
    });
    const payload = await safeJson(response);
    if (response.ok) setPostsState((s) => ({ ...s, page: 1 }));
    return { ok: response.ok, message: payload.message };
  }

  async function upsertSetting() {
    let value = settingsState.value;
    try {
      value = JSON.parse(settingsState.value);
    } catch (error) {
      // keep as string if not valid JSON
    }

    const response = await apiFetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: settingsState.key, value }),
    });
    const payload = await safeJson(response);
    if (response.ok) {
      setSettingsState((s) => ({ ...s, key: "", value: "", page: 1 }));
    }
    return { ok: response.ok, message: payload.message };
  }

  function renderSection() {
    if (section === "overview") {
      return (
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-brand-light">Admin Super Panel</p>
              <h1 className="mt-3 text-4xl font-semibold text-white">Global control center</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Enterprise-grade visibility and moderation across users, matches, tournaments, and social content.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total users" value={overview?.totalUsers ?? "-"} helper="All registered accounts." />
            <StatCard label="Active users (7d)" value={overview?.activeUsers7d ?? "-"} helper="Based on recent updates." />
            <StatCard label="Matches played" value={overview?.totalMatchesPlayed ?? "-"} helper="Finished matches only." />
            <StatCard label="Tournaments created" value={overview?.totalTournamentsCreated ?? "-"} helper="All tournament records." />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold">Most liked posts</h2>
              <div className="mt-4 space-y-3">
                {(overview?.mostLikedPosts || []).map((post) => (
                  <div key={post.id} className="rounded-2xl border border-white/10 px-4 py-3">
                    <p className="text-sm uppercase tracking-[0.2em] text-brand-light">{post.type}</p>
                    <p className="mt-2 font-medium text-white">{post.title}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Likes: {post.likesCount} · Comments: {post.commentsCount}
                    </p>
                  </div>
                ))}
                {!overview?.mostLikedPosts?.length ? (
                  <p className="text-sm text-slate-400">No post analytics yet.</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-semibold">Growth trends</h2>
              <p className="mt-2 text-sm text-slate-400">
                Daily counts for the last two weeks (users/matches/tournaments/posts).
              </p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                    <thead className="bg-white/5 text-slate-300">
                      <tr>
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Users</th>
                        <th className="px-3 py-2 font-medium">Matches</th>
                        <th className="px-3 py-2 font-medium">Tournaments</th>
                        <th className="px-3 py-2 font-medium">Posts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {(overview?.growthTrends || []).map((row) => (
                        <tr key={row.date}>
                          <td className="px-3 py-2">{row.date}</td>
                          <td className="px-3 py-2">{row.users}</td>
                          <td className="px-3 py-2">{row.matches}</td>
                          <td className="px-3 py-2">{row.tournaments}</td>
                          <td className="px-3 py-2">{row.posts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (section === "users") {
      const rows = usersState.data?.rows || [];
      return (
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold text-white">Users</h2>
              <p className="mt-2 text-sm text-slate-400">Filter, suspend, and re-activate any account globally.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                value={usersState.q}
                onChange={(e) => setUsersState((s) => ({ ...s, q: e.target.value }))}
                placeholder="Search name/email"
                className="w-56 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white outline-none focus:border-brand/40"
              />
              <select
                value={usersState.role}
                onChange={(e) => setUsersState((s) => ({ ...s, role: e.target.value }))}
                className="rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white outline-none focus:border-brand/40"
              >
                <option value="">All roles</option>
                <option value="admin">Admin</option>
                <option value="turf_owner">Turf owner</option>
                <option value="player">Player</option>
              </select>
              <select
                value={usersState.status}
                onChange={(e) => setUsersState((s) => ({ ...s, status: e.target.value }))}
                className="rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white outline-none focus:border-brand/40"
              >
                <option value="">All status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <button
                type="button"
                onClick={() => setUsersState((s) => ({ ...s, page: 1 }))}
                className="rounded-full border border-white/10 px-5 py-2 text-sm text-slate-200 hover:border-brand/40 hover:bg-brand/10"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="mt-6">
            <Table
              columns={[
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                { key: "role", label: "Role" },
                { key: "status", label: "Status" },
              ]}
              rows={rows}
              emptyMessage={usersState.loading ? "Loading..." : "No users found."}
              actions={(row) => (
                <>
                  {row.status === "suspended" ? (
                    <button
                      type="button"
                      onClick={() =>
                        openConfirm({
                          title: "Activate user?",
                          description: `Re-activate ${row.email}.`,
                          label: "Activate",
                          run: () => activateUser(row.id),
                        })
                      }
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-brand/40"
                    >
                      Activate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        openConfirm({
                          title: "Suspend user?",
                          description: `Suspend ${row.email}. This prevents future logins.`,
                          label: "Suspend",
                          run: () => suspendUser(row.id),
                        })
                      }
                      className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-100 hover:border-rose-400"
                    >
                      Suspend
                    </button>
                  )}
                </>
              )}
            />

            <div className="mt-5 flex items-center justify-between text-sm text-slate-300">
              <p>
                Page {usersState.data?.page || usersState.page} · Total {usersState.data?.total ?? "-"}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={usersState.page <= 1}
                  onClick={() => setUsersState((s) => ({ ...s, page: Math.max(s.page - 1, 1) }))}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setUsersState((s) => ({ ...s, page: s.page + 1 }))}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (section === "matches") {
      const rows = matchesState.data?.rows || [];
      return (
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold text-white">Matches control</h2>
              <p className="mt-2 text-sm text-slate-400">Force status, reset, and delete matches (audit logged).</p>
            </div>
          </div>

          <div className="mt-6">
            <Table
              columns={[
                { key: "id", label: "Match ID" },
                { key: "status", label: "Status" },
                { key: "tournamentId", label: "Tournament" },
              ]}
              rows={rows}
              emptyMessage={matchesState.loading ? "Loading..." : "No matches found."}
              actions={(row) => (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      openConfirm({
                        title: "Force match to LIVE?",
                        description: `This overrides normal state transitions for match ${row.id}.`,
                        label: "Force LIVE",
                        run: () => forceMatchStatus(row.id, "live"),
                      })
                    }
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-brand/40"
                  >
                    Force LIVE
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openConfirm({
                        title: "Force match to FINISHED?",
                        description: `This will mark match ${row.id} as finished.`,
                        label: "Force FINISHED",
                        run: () => forceMatchStatus(row.id, "finished"),
                      })
                    }
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-brand/40"
                  >
                    Force FINISHED
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openConfirm({
                        title: "Reset match?",
                        description: `This deletes events and sets match ${row.id} back to pending.`,
                        label: "Reset",
                        run: () => resetMatch(row.id),
                      })
                    }
                    className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-100 hover:border-amber-400"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openConfirm({
                        title: "Delete match?",
                        description: `This permanently deletes match ${row.id} and its events.`,
                        label: "Delete",
                        run: () => deleteMatch(row.id),
                      })
                    }
                    className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-100 hover:border-rose-400"
                  >
                    Delete
                  </button>
                </>
              )}
            />

            <div className="mt-5 flex items-center justify-between text-sm text-slate-300">
              <p>Page {matchesState.data?.page || matchesState.page}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={matchesState.page <= 1}
                  onClick={() => setMatchesState((s) => ({ ...s, page: Math.max(s.page - 1, 1) }))}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setMatchesState((s) => ({ ...s, page: s.page + 1 }))}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (section === "tournaments") {
      const rows = tournamentsState.data?.rows || [];
      return (
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold text-white">Tournament control</h2>
              <p className="mt-2 text-sm text-slate-400">Force-close and reset tournaments globally.</p>
            </div>
          </div>

          <div className="mt-6">
            <Table
              columns={[
                { key: "name", label: "Name" },
                { key: "type", label: "Type" },
                { key: "status", label: "Status" },
                { key: "matchesCount", label: "Matches" },
              ]}
              rows={rows}
              emptyMessage={tournamentsState.loading ? "Loading..." : "No tournaments found."}
              actions={(row) => (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      openConfirm({
                        title: "Force-close tournament?",
                        description: `Marks "${row.name}" as completed.`,
                        label: "Force close",
                        run: () => closeTournament(row.id),
                      })
                    }
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-brand/40"
                  >
                    Force close
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openConfirm({
                        title: "Reset tournament?",
                        description: `Resets bracket metadata for "${row.name}" (does not delete matches).`,
                        label: "Reset",
                        run: () => resetTournament(row.id),
                      })
                    }
                    className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-100 hover:border-amber-400"
                  >
                    Reset
                  </button>
                </>
              )}
            />

            <div className="mt-5 flex items-center justify-between text-sm text-slate-300">
              <p>Page {tournamentsState.data?.page || tournamentsState.page}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={tournamentsState.page <= 1}
                  onClick={() => setTournamentsState((s) => ({ ...s, page: Math.max(s.page - 1, 1) }))}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setTournamentsState((s) => ({ ...s, page: s.page + 1 }))}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (section === "moderation") {
      const rows = postsState.data?.rows || [];
      return (
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold text-white">Content moderation</h2>
              <p className="mt-2 text-sm text-slate-400">Pin or remove posts and clean up spam content.</p>
            </div>
            <div className="flex gap-2">
              <input
                value={postsState.q}
                onChange={(e) => setPostsState((s) => ({ ...s, q: e.target.value }))}
                placeholder="Search posts"
                className="w-72 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white outline-none focus:border-brand/40"
              />
              <button
                type="button"
                onClick={() => setPostsState((s) => ({ ...s, page: 1 }))}
                className="rounded-full border border-white/10 px-5 py-2 text-sm text-slate-200 hover:border-brand/40 hover:bg-brand/10"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="mt-6">
            <Table
              columns={[
                { key: "type", label: "Type" },
                { key: "title", label: "Title" },
                { key: "likesCount", label: "Likes" },
                { key: "commentsCount", label: "Comments" },
                { key: "pinned", label: "Pinned" },
              ]}
              rows={rows}
              emptyMessage={postsState.loading ? "Loading..." : "No posts found."}
              actions={(row) => (
                <>
                  <button
                    type="button"
                    onClick={() => runAction(() => togglePinPost(row.id, !row.pinned))}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-brand/40"
                  >
                    {row.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      openConfirm({
                        title: "Delete post?",
                        description: `This permanently removes "${row.title}" and all its comments/likes.`,
                        label: "Delete",
                        run: () => deletePost(row.id),
                      })
                    }
                    className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-100 hover:border-rose-400"
                  >
                    Delete
                  </button>
                </>
              )}
            />

            <div className="mt-5 flex items-center justify-between text-sm text-slate-300">
              <p>Page {postsState.data?.page || postsState.page}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={postsState.page <= 1}
                  onClick={() => setPostsState((s) => ({ ...s, page: Math.max(s.page - 1, 1) }))}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPostsState((s) => ({ ...s, page: s.page + 1 }))}
                  className="rounded-full border border-white/10 px-4 py-2 text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (section === "settings") {
      const rows = settingsState.data?.rows || [];
      return (
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold text-white">System settings</h2>
              <p className="mt-2 text-sm text-slate-400">Centralized feature toggles and rules (stored in DB).</p>
            </div>
            <div className="flex gap-2">
              <input
                value={settingsState.q}
                onChange={(e) => setSettingsState((s) => ({ ...s, q: e.target.value }))}
                placeholder="Search keys"
                className="w-64 rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white outline-none focus:border-brand/40"
              />
              <button
                type="button"
                onClick={() => setSettingsState((s) => ({ ...s, page: 1 }))}
                className="rounded-full border border-white/10 px-5 py-2 text-sm text-slate-200 hover:border-brand/40 hover:bg-brand/10"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <Table
                columns={[
                  { key: "key", label: "Key" },
                  { key: "updatedAt", label: "Updated" },
                ]}
                rows={rows.map((row) => ({
                  ...row,
                  updatedAt: row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-",
                }))}
                emptyMessage={settingsState.loading ? "Loading..." : "No settings found."}
              />

              <div className="mt-5 flex items-center justify-between text-sm text-slate-300">
                <p>Page {settingsState.data?.page || settingsState.page}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={settingsState.page <= 1}
                    onClick={() => setSettingsState((s) => ({ ...s, page: Math.max(s.page - 1, 1) }))}
                    className="rounded-full border border-white/10 px-4 py-2 text-xs disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsState((s) => ({ ...s, page: s.page + 1 }))}
                    className="rounded-full border border-white/10 px-4 py-2 text-xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-xl font-semibold text-white">Upsert setting</h3>
              <p className="mt-2 text-sm text-slate-400">
                Value accepts JSON. If JSON parsing fails, it will be stored as a string.
              </p>
              <div className="mt-4 space-y-3">
                <input
                  value={settingsState.key}
                  onChange={(e) => setSettingsState((s) => ({ ...s, key: e.target.value }))}
                  placeholder="key (e.g. feature.socialEnabled)"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-brand/40"
                />
                <textarea
                  value={settingsState.value}
                  onChange={(e) => setSettingsState((s) => ({ ...s, value: e.target.value }))}
                  placeholder='value (e.g. {"enabled":true})'
                  className="min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-brand/40"
                />
                <button
                  type="button"
                  onClick={() =>
                    openConfirm({
                      title: "Update system setting?",
                      description: `Upsert key "${settingsState.key}".`,
                      label: "Upsert",
                      run: () => upsertSetting(),
                    })
                  }
                  className="w-full rounded-2xl border border-white/10 px-5 py-3 text-sm text-slate-100 hover:border-brand/40 hover:bg-brand/10"
                >
                  Upsert
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (section === "notifications") {
      return (
        <div>
          <h2 className="text-3xl font-semibold text-white">Notifications center</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
            The admin notification endpoints are available and audit-logged, but the underlying notification subsystem
            isn’t present in this repo snapshot. These endpoints currently record intent for future wiring.
          </p>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-300">
              Available APIs:
              <span className="ml-2 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                POST /api/admin/notify/global
              </span>
              <span className="ml-2 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                POST /api/admin/notify/role-based
              </span>
            </p>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.2),_transparent_35%),linear-gradient(180deg,_#020617_0%,_#0f172a_55%,_#111827_100%)] text-white">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 backdrop-blur">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-light">TurfX Control</p>
            <h1 className="mt-3 text-2xl font-semibold">Super Panel</h1>
            <p className="mt-2 text-sm text-slate-400">Global control across the platform.</p>
          </div>

          <nav className="mt-8 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSection(item.key)}
                className={classNames(
                  "w-full rounded-2xl border px-4 py-3 text-left text-sm transition",
                  section === item.key
                    ? "border-brand/50 bg-brand/10 text-white"
                    : "border-transparent text-slate-200 hover:border-brand/50 hover:bg-brand/10"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur lg:p-6">
          {error ? (
            <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
          {renderSection()}
        </section>
      </div>

      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmLabel={confirm.label}
        onCancel={() => setConfirm({ open: false, title: "", description: "", label: "", run: null })}
        onConfirm={async () => {
          const run = confirm.run;
          setConfirm({ open: false, title: "", description: "", label: "", run: null });
          if (run) await runAction(run);
        }}
      />
    </main>
  );
}

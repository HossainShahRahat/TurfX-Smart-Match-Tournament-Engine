"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/services/api-client";

const roleRoutes = {
  admin: "/dashboard/admin",
  turf_owner: "/dashboard/turf",
  player: "/dashboard/player",
};

export default function LoginPanel() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Login failed.");
      }

      router.push(roleRoutes[payload.data.user.role] || "/dashboard");
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-3xl border border-white/10 bg-slate-950/50 p-6 text-left"
    >
      <h2 className="text-xl font-semibold text-white">Sign In</h2>
      <p className="mt-2 text-sm text-slate-400">
        Sign in with email/username &amp; password. Admin: use
        ADMIN_EMAIL/ADMIN_PASSWORD from backend/.env (auto-saves hashed on first
        login). Players: auto-generated on creation (username/pw = lowercase
        no-space name).
      </p>

      <div className="mt-5 grid gap-3">
        <input
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
          placeholder="Email or username"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
        />
        <input
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button
          className="rounded-2xl bg-brand px-4 py-3 font-medium text-white transition hover:bg-brand-dark disabled:opacity-70"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}
    </form>
  );
}

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/auth";

export default function LoginPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await loginUser({ username, password });
      window.localStorage.setItem("auth_token", res.token);
      nav("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h1 className="text-xl font-semibold text-white">Login</h1>
        <p className="mt-1 text-sm text-slate-400">Use your credentials to submit data.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Username</div>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              placeholder="your username"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Password</div>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-red-800 bg-red-950/30 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? "Signing in..." : "Login"}
          </button>

          <div className="text-center text-sm text-slate-400">
            New here?{" "}
            <Link to="/register" className="text-indigo-300 hover:text-white">
              Create an account
            </Link>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">Tip</h2>
        <p className="mt-3 text-sm text-slate-300">
          Even if your backend endpoints are public right now, logging in keeps the system ready for
          future role-based access.
        </p>
      </div>
    </div>
  );
}


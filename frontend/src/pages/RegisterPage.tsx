import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";

export default function RegisterPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await registerUser({ username, email, password });
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
        <h1 className="text-xl font-semibold text-white">Create account</h1>
        <p className="mt-1 text-sm text-slate-400">
          Register to submit incident data and access early warning workflows.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Username</div>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              placeholder="e.g. community-reporter"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Email (optional)</div>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
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
              minLength={8}
              placeholder="Minimum 8 characters"
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
            {busy ? "Creating..." : "Register"}
          </button>

          <div className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-300 hover:text-white">
              Login
            </Link>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">What you can do</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            Report floods, fires, conflicts, disease outbreaks, and more.
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            Use map + timeline filters from early 2000 to today.
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            Trigger early warnings based on recent incident volume and severity.
          </div>
        </div>
      </div>
    </div>
  );
}


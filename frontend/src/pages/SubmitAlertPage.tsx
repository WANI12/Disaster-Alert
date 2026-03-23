import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client";

type Location = {
  id: number;
  name: string;
  state: string;
  county: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

export default function SubmitAlertPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stateFilter, setStateFilter] = useState("");
  const [locationId, setLocationId] = useState<string>("");

  const [disasterType, setDisasterType] = useState("Flood");
  const [severity, setSeverity] = useState("2");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("New");
  const [source, setSource] = useState("Community");
  const [occurredAt, setOccurredAt] = useState("");

  const locationOptions = useMemo(() => {
    return locations.map((l) => ({
      value: String(l.id),
      label: `${l.name} (${l.state}${l.county ? `, ${l.county}` : ""})`,
    }));
  }, [locations]);

  async function loadLocations() {
    setError(null);
    try {
      const qs = stateFilter ? `?state=${encodeURIComponent(stateFilter)}` : "";
      const data = await apiFetch<Location[]>(`/locations/${qs}`);
      setLocations(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    loadLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateFilter]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload: any = {
        disaster_type: disasterType,
        severity: Number(severity),
        title,
        description,
        status,
        source,
        location: Number(locationId),
      };
      if (occurredAt) payload.occurred_at = new Date(occurredAt).toISOString();

      await apiFetch(`/alerts/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setTitle("");
      setDescription("");
      setOccurredAt("");
      alert("Incident submitted successfully.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h1 className="text-xl font-semibold text-white">Report a new incident</h1>
        <p className="mt-1 text-sm text-slate-400">Submit incident details for dashboards and early warnings.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Disaster type</div>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              value={disasterType}
              onChange={(e) => setDisasterType(e.target.value)}
            >
              <option value="Flood">Flood</option>
              <option value="Fire">Fire</option>
              <option value="Conflict">Conflict</option>
              <option value="Disease Outbreak">Disease Outbreak</option>
              <option value="Drought">Drought</option>
              <option value="Landslide">Landslide</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Severity</div>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="1">Low (1)</option>
              <option value="2">Moderate (2)</option>
              <option value="3">High (3)</option>
              <option value="4">Extreme (4)</option>
              <option value="5">Catastrophic (5)</option>
            </select>
          </label>

          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Title</div>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              placeholder="Short summary of the incident"
            />
          </label>

          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Description</div>
            <textarea
              className="w-full min-h-28 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details (damage, casualties, affected areas, etc.)"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-sm text-slate-300">Status</div>
              <select
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="New">New</option>
                <option value="Verified">Verified</option>
                <option value="Resolved">Resolved</option>
                <option value="Dismissed">Dismissed</option>
              </select>
            </label>

            <label className="block">
              <div className="mb-1 text-sm text-slate-300">Source</div>
              <input
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </label>
          </div>

          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Occurred at (optional)</div>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-sm text-slate-300">State filter</div>
              <input
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                placeholder="Leave blank for all"
              />
            </label>

            <label className="block">
              <div className="mb-1 text-sm text-slate-300">Location</div>
              <select
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select location
                </option>
                {locationOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-800 bg-red-950/30 p-3 text-sm text-red-200">{error}</div>
          ) : null}

          <button
            disabled={busy}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {busy ? "Submitting..." : "Submit Incident"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">How it helps</h2>
        <p className="mt-2 text-sm text-slate-300">
          Your new incident flows into the dashboard timeline and map markers using the same `from/to` filters
          (early 2000s to today). Severe incidents increase map risk coloring and can trigger early warnings.
        </p>

        <div className="mt-5 space-y-3 text-sm text-slate-300">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            Uses <code className="text-slate-100">POST /api/alerts/</code>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            Location selected from <code className="text-slate-100">GET /api/locations/</code>
          </div>
        </div>
      </div>
    </div>
  );
}


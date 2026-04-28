import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api/client";

type Location = {
  id: number;
  name: string;
  state: string;
  county: string;
};

const SOUTH_SUDAN_STATES = [
  "Abyei",
  "Central Equatoria",
  "Eastern Equatoria",
  "Jonglei",
  "Lakes",
  "Northern Bahr el Ghazal",
  "Pibor",
  "Ruweng",
  "Unity",
  "Upper Nile",
  "Warrap",
  "Western Bahr el Ghazal",
  "Western Equatoria",
];

export default function SubmitReportPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [stateFilter, setStateFilter] = useState("");
  const [locationId, setLocationId] = useState<string>("");

  const [alertId, setAlertId] = useState<string>("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");
  const [description, setDescription] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        alert: Number(alertId),
        reporter_name: reporterName,
        reporter_phone: reporterPhone,
        description,
        location: Number(locationId),
      };
      await apiFetch(`/reports/`, { method: "POST", body: JSON.stringify(payload) });
      setAlertId("");
      setReporterName("");
      setReporterPhone("");
      setDescription("");
      alert("Report submitted successfully.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h1 className="text-xl font-semibold text-white">Submit an incident report</h1>
        <p className="mt-1 text-sm text-slate-400">
          Link your report to an existing alert so responders can verify and coordinate.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Alert ID</div>
            <input
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              value={alertId}
              onChange={(e) => setAlertId(e.target.value)}
              required
              type="number"
              placeholder="e.g. 1"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-sm text-slate-300">Reporter name</div>
              <input
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Your name"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-sm text-slate-300">Reporter phone</div>
              <input
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="+211..."
              />
            </label>
          </div>

          <label className="block">
            <div className="mb-1 text-sm text-slate-300">Description</div>
            <textarea
              className="w-full min-h-28 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Describe what you observed"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-sm text-slate-300">State / Location</div>
              <select
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
              >
                <option value="">Select a state...</option>
                {SOUTH_SUDAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
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
            {busy ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-lg font-semibold text-white">Connect to your backend</h2>
        <div className="mt-3 space-y-3 text-sm text-slate-300">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            Uses <code className="text-slate-100">POST /api/reports/</code> to save report details.
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            Location choices come from <code className="text-slate-100">GET /api/locations/</code>.
          </div>
        </div>
      </div>
    </div>
  );
}


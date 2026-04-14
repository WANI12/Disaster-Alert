import React, { useEffect, useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import FilterBar from "../ui";
import { apiFetch } from "../api/client";
import { ClimatePayload, GeoJSONFeatureCollection, TimelinePayload } from "../ui/types";

const DEFAULT_FROM = "2000-01-01";

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function riskColor(riskLevel: string | undefined) {
  switch (riskLevel) {
    case "catastrophic":
      return "#fb7185";
    case "extreme":
      return "#f43f5e";
    case "high":
      return "#f97316";
    case "moderate":
      return "#22c55e";
    case "low":
    default:
      return "#60a5fa";
  }
}

export default function DashboardPage() {
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(todayIsoDate());
  const [disasterType, setDisasterType] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [minSeverity, setMinSeverity] = useState<string>("1");
  const [granularity, setGranularity] = useState<string>("auto");
  const [timeField, setTimeField] = useState<"occurred_at" | "created_at">("occurred_at");

  const [timeline, setTimeline] = useState<TimelinePayload | null>(null);
  const [mapData, setMapData] = useState<GeoJSONFeatureCollection | null>(null);
  const [climateData, setClimateData] = useState<ClimatePayload | null>(null);
  const [earlyWarning, setEarlyWarning] = useState<GeoJSONFeatureCollection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSatellite, setShowSatellite] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("from", from);
    params.set("to", to);
    params.set("time_field", timeField);
    if (granularity) params.set("granularity", granularity);
    if (disasterType) params.set("disaster_type", disasterType);
    if (state) params.set("state", state);
    if (minSeverity) params.set("min_severity", minSeverity);
    return params.toString();
  }, [from, to, disasterType, state, minSeverity, granularity, timeField]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setBusy(true);
      setError(null);
      try {
        const [t, m, c, e] = await Promise.all([
          apiFetch<TimelinePayload>(`/analytics/timeline/?${query}`),
          apiFetch<GeoJSONFeatureCollection>(`/analytics/map/?${query}`),
          apiFetch<ClimatePayload>(`/analytics/climate/?${query}`),
          apiFetch<GeoJSONFeatureCollection>(
            `/analytics/early-warning/?${query}&window_days=7&threshold_count=3&format=geojson`,
          ),
        ]);
        if (!cancelled) {
          setTimeline(t);
          setMapData(m);
          setClimateData(c);
          setEarlyWarning(e);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const mapMarkers = mapData?.features ?? [];
  const warningMarkers = earlyWarning?.features ?? [];
  const climateMarkers = climateData?.markers ?? [];
  const satelliteTileUrl =
    climateData?.satellite_tiles?.[0]?.url ||
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  const satelliteAttribution =
    climateData?.satellite_tiles?.[0]?.attribution || "&copy; ESRI World Imagery";

  const lineData = (timeline?.total_by_period ?? []).map((p) => ({
    x: p.period ?? "",
    count: p.count,
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <FilterBar
          from={from}
          to={to}
          disasterType={disasterType}
          state={state}
          minSeverity={minSeverity}
          granularity={granularity}
          timeField={timeField}
          onChange={(next) => {
            setFrom(next.from);
            setTo(next.to);
            setDisasterType(next.disasterType);
            setState(next.state);
            setMinSeverity(next.minSeverity);
            setGranularity(next.granularity);
            setTimeField(next.timeField);
          }}
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-800 bg-red-950/30 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Incident Volume Timeline</h2>
              <p className="text-sm text-slate-400">
                Aggregated counts over time ({timeField.replace("_", " ")}).
              </p>
            </div>
            <div className="text-xs text-slate-400">{busy ? "Updating..." : "Live"}</div>
          </div>

          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <XAxis dataKey="x" tick={{ fill: "#cbd5e1", fontSize: 10 }} minTickGap={10} />
                <YAxis tick={{ fill: "#cbd5e1" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Line type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="text-lg font-semibold text-white">South Sudan Climate (IGAD)</h2>
          <p className="text-sm text-slate-400">
            Climate indicators for South Sudan with IGAD monitoring and satellite-derived insights.
          </p>

          <div className="mt-4 text-sm text-slate-300">
            {climateData ? climateData.summary : "Loading climate data..."}
          </div>

          <div className="mt-4 grid gap-3">
            {(climateData?.indicators ?? []).map((indicator) => (
              <div
                key={indicator.name}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <div className="text-sm text-slate-400">{indicator.name}</div>
                <div className="mt-1 text-lg font-semibold text-white">
                  {indicator.value} {indicator.unit}
                </div>
              </div>
            ))}

            {!climateData ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-slate-400">
                Climate indicator data is being fetched.
              </div>
            ) : null}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Map base layer</div>
                <div className="text-xs text-slate-400">Toggle satellite/street imagery.</div>
              </div>
              <button
                type="button"
                onClick={() => setShowSatellite((current) => !current)}
                className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-200 transition hover:border-slate-500 hover:bg-slate-700"
              >
                {showSatellite ? "Satellite" : "Street"}
              </button>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              {showSatellite
                ? "Satellite imagery from ESRI is displayed on the map."
                : "Street basemap is shown for location context."}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="text-lg font-semibold text-white">Early Warnings (7 days)</h2>
          <p className="text-sm text-slate-400">Triggered by incident volume threshold.</p>

          <div className="mt-4 space-y-3 max-h-96 overflow-auto pr-1">
            {warningMarkers.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-300">
                No warnings triggered for this selection.
              </div>
            ) : null}

            {warningMarkers.slice(0, 30).map((f, idx) => {
              const p = f.properties as any;
              const risk = p?.risk_level;
              const color = riskColor(risk);
              return (
                <div
                  key={`${p?.location_id ?? "x"}-${idx}`}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {p?.name ?? "Unknown location"}
                      </div>
                      <div className="text-xs text-slate-400">{p?.state}</div>
                    </div>
                    <div className="text-xs rounded-lg px-2 py-1 border border-slate-800" style={{ color }}>
                      {risk ?? "low"}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-300">
                    Recent count: <span className="text-white font-semibold">{p?.count_recent ?? "-"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold text-white">Map (GeoJSON)</h2>
        <p className="text-sm text-slate-400">
          Filtered markers for the same time range. Risk color is based on max severity in the range.
        </p>

        <div className="mt-4 h-[520px] w-full overflow-hidden rounded-xl border border-slate-800">
          <MapContainer
            center={[7.5, 31.6]}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
          >
            {showSatellite ? (
              <TileLayer url={satelliteTileUrl} attribution={satelliteAttribution} />
            ) : (
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
            )}

            {mapMarkers.map((f, idx) => {
              const coords = f.geometry?.coordinates as [number, number] | undefined;
              if (!coords) return null;
              const lon = coords[0];
              const lat = coords[1];
              const p = f.properties as any;
              const color = riskColor(p?.risk_level);
              const weight = Math.min(12, 3 + Number(p?.count ?? 1));
              return (
                <CircleMarker
                  key={`m-${idx}`}
                  center={[lat, lon]}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.25,
                    weight: 2,
                  }}
                  radius={weight}
                >
                  <Popup>
                    <div style={{ fontSize: 13 }}>
                      <div className="font-semibold">{p?.name}</div>
                      <div>{p?.state}</div>
                      <div>Incidents: {p?.count}</div>
                      <div>Max severity: {p?.max_severity}</div>
                      <div>Risk: {p?.risk_level}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {climateMarkers.map((f, idx) => {
              const coords = f.geometry?.coordinates as [number, number] | undefined;
              if (!coords) return null;
              const lon = coords[0];
              const lat = coords[1];
              const p = f.properties as any;
              const color = "#f59e0b";
              return (
                <CircleMarker
                  key={`c-${idx}`}
                  center={[lat, lon]}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.3,
                    weight: 2,
                  }}
                  radius={10}
                >
                  <Popup>
                    <div style={{ fontSize: 13 }}>
                      <div className="font-semibold">{p?.name}</div>
                      <div>{p?.indicator}</div>
                      <div>
                        {p?.value} {p?.trend}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

            {warningMarkers.map((f, idx) => {
              const coords = f.geometry?.coordinates as [number, number] | undefined;
              if (!coords) return null;
              const lon = coords[0];
              const lat = coords[1];
              const p = f.properties as any;
              const color = "#f43f5e";
              return (
                <CircleMarker
                  key={`w-${idx}`}
                  center={[lat, lon]}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.35,
                    weight: 3,
                  }}
                  radius={16}
                >
                  <Popup>
                    <div style={{ fontSize: 13 }}>
                      <div className="font-semibold">{p?.name}</div>
                      <div>{p?.state}</div>
                      <div>Triggered recent count: {p?.count_recent}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}


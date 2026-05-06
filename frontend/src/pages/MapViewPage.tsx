import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { apiFetch } from "../api/client";
import { GeoJSONFeatureCollection } from "../ui/types";
import HeatMapLegend, {
  heatStressLevels,
  conflictLevels,
  droughtLevels,
  rainfallLevels,
  agricultureLevels,
} from "../ui/HeatMapLegend";
import { MapPin, Layers, Thermometer, Droplet, ShieldAlert } from "lucide-react";

const DEFAULT_FROM = "2000-01-01";

const indicatorFilters = [
  { id: "heat", label: "Heat Stress", icon: Thermometer },
  { id: "drought", label: "Drought", icon: Droplet },
  { id: "rainfall", label: "Rainfall", icon: Layers },
  { id: "agriculture", label: "Agriculture", icon: MapPin },
  { id: "conflict", label: "Conflict", icon: ShieldAlert },
];

const indicatorFilterMap: Record<string, string[]> = {
  heat: ["heat", "heatstress", "heat index"],
  drought: ["drought"],
  rainfall: ["rainfall", "extreme-rainfall", "rain"],
  agriculture: ["crop", "agriculture"],
  conflict: ["conflict"],
};

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

function formatValue(value: number | string | undefined) {
  if (value === undefined || value === null) return "N/A";
  return typeof value === "number" ? value.toLocaleString() : String(value);
}

function getIndicatorValue(properties: any, indicator: string) {
  switch (indicator) {
    case "heat":
      return properties?.heat_index ?? properties?.temperature ?? properties?.value;
    case "drought":
      return properties?.drought_index ?? properties?.soil_moisture ?? properties?.severity_score;
    case "rainfall":
      return properties?.rainfall_amount ?? properties?.precipitation ?? properties?.rainfall;
    case "agriculture":
      return properties?.crop_damage_score ?? properties?.crop_yield_loss ?? properties?.agriculture_score;
    case "conflict":
      return properties?.conflict_intensity ?? properties?.risk_score ?? properties?.count;
    default:
      return properties?.count ?? 0;
  }
}

function getIndicatorLabel(indicator: string) {
  const item = indicatorFilters.find((option) => option.id === indicator);
  return item ? item.label : "Indicator";
}

export default function MapViewPage() {
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(todayIsoDate());
  const [selectedIndicator, setSelectedIndicator] = useState<string>("heat");
  const [mapData, setMapData] = useState<GeoJSONFeatureCollection | null>(null);
  const [earlyWarning, setEarlyWarning] = useState<GeoJSONFeatureCollection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSatellite, setShowSatellite] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("from", from);
    params.set("to", to);
    return params.toString();
  }, [from, to]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setBusy(true);
      setError(null);
      try {
        const [m, e] = await Promise.all([
          apiFetch<GeoJSONFeatureCollection>(`/analytics/map/?${query}`),
          apiFetch<GeoJSONFeatureCollection>(
            `/analytics/early-warning/?${query}&window_days=7&threshold_count=3&format=geojson`,
          ),
        ]);
        if (!cancelled) {
          setMapData(m);
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

  const markers = mapData?.features ?? [];
  const warningMarkers = earlyWarning?.features ?? [];

  const filteredMarkers = markers.filter((feature) => {
    const p = feature.properties as any;
    const disasterType = String(p?.disaster_type ?? "").toLowerCase();
    const validTypes = indicatorFilterMap[selectedIndicator] || [];
    if (!validTypes.length) return true;
    return validTypes.some((type) => disasterType.includes(type));
  });

  const importantPoints = [...filteredMarkers]
    .map((feature) => {
      const p = feature.properties as any;
      return {
        feature,
        score: Number(getIndicatorValue(p, selectedIndicator) ?? 0),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const tileUrl = showSatellite
    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution = showSatellite
    ? "&copy; ESRI World Imagery"
    : "&copy; OpenStreetMap contributors";

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Map View</h1>
          <p className="text-slate-400">
            View high-affected points for selected indicators across the region.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <section className="mb-8 rounded-lg border border-slate-700 bg-slate-800/50 p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Indicator</label>
              <select
                value={selectedIndicator}
                onChange={(e) => setSelectedIndicator(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {indicatorFilters.map((indicator) => (
                  <option key={indicator.id} value={indicator.id}>
                    {indicator.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-slate-400 text-sm">
                Showing points where the selected indicator is most concentrated.
              </p>
              <p className="text-slate-500 text-xs">Data is filtered by incident map and warning outputs.</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
              onClick={() => setShowSatellite((current) => !current)}
            >
              {showSatellite ? "Satellite" : "Street"} View
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-lg border border-red-700 bg-red-950/30 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr] mb-12">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50">
            <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">High-Affected Areas</h2>
                <p className="text-sm text-slate-400">Map markers sized by local impact and colored by risk/indicator.</p>
              </div>
              <div className="text-xs text-slate-400">{busy ? "Updating..." : "Live"}</div>
            </div>
            <div className="h-[640px] w-full overflow-hidden rounded-b-lg">
              <MapContainer center={[7.5, 31.6]} zoom={6} style={{ height: "100%", width: "100%" }}>
                <TileLayer url={tileUrl} attribution={attribution} />
                {filteredMarkers.map((feature, idx) => {
                  const coords = feature.geometry?.coordinates as [number, number] | undefined;
                  if (!coords) return null;
                  const lon = coords[0];
                  const lat = coords[1];
                  const p = feature.properties as any;
                  const value = Number(getIndicatorValue(p, selectedIndicator) ?? 0);
                  const radius = Math.max(6, Math.min(22, value ? value * 2 : 8));
                  const color = riskColor(String(p?.risk_level ?? "low"));
                  return (
                    <CircleMarker
                      key={`marker-${idx}`}
                      center={[lat, lon]}
                      radius={radius}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.35, weight: 2 }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <div className="font-semibold text-slate-900">{p?.name ?? "Unknown location"}</div>
                          <div className="text-xs text-slate-600">{p?.disaster_type ?? "Unknown hazard"}</div>
                          <div className="text-xs text-slate-600">
                            {getIndicatorLabel(selectedIndicator)}: {formatValue(value)}
                          </div>
                          <div className="text-xs text-slate-600">Risk: {p?.risk_level ?? "low"}</div>
                          <div className="text-xs text-slate-600">Reports: {p?.count ?? 0}</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
                {warningMarkers.map((feature, idx) => {
                  const coords = feature.geometry?.coordinates as [number, number] | undefined;
                  if (!coords) return null;
                  const lon = coords[0];
                  const lat = coords[1];
                  const p = feature.properties as any;
                  const color = "#f97316";
                  return (
                    <CircleMarker
                      key={`warning-${idx}`}
                      center={[lat, lon]}
                      radius={10}
                      pathOptions={{ color, fillColor: color, fillOpacity: 0.2, weight: 2, dashArray: "4 4" }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <div className="font-semibold text-slate-900">{p?.name ?? "Warning location"}</div>
                          <div className="text-xs text-slate-600">Early warning: {p?.risk_level ?? "low"}</div>
                          <div className="text-xs text-slate-600">Recent reports: {p?.count_recent ?? 0}</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Indicator Legend</h3>
              <HeatMapLegend selectedFilter={selectedIndicator} onFilterChange={setSelectedIndicator} />
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Top Affected Points</h3>
              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {importantPoints.length === 0 ? (
                  <div className="text-slate-400 text-sm">No high-impact locations available for this indicator.</div>
                ) : (
                  importantPoints.map(({ feature, score }, idx) => {
                    const p = feature.properties as any;
                    return (
                      <div key={idx} className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-white">{p?.name ?? `Point ${idx + 1}`}</div>
                            <div className="text-xs text-slate-400">{p?.disaster_type ?? "Unknown hazard"}</div>
                          </div>
                          <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-100">
                            {formatValue(score)}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-slate-400">{getIndicatorLabel(selectedIndicator)} level</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}

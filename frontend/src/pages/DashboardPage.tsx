import React, { useEffect, useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { apiFetch } from "../api/client";
import { ClimatePayload, GeoJSONFeatureCollection, TimelinePayload } from "../ui/types";
import HeroSection from "../ui/HeroSection";
import HazardCard from "../ui/HazardCard";
import StatCard from "../ui/StatCard";
import FilterBar from "../ui";
import HeatMapLegend, { heatStressLevels, conflictLevels, droughtLevels, rainfallLevels, agricultureLevels } from "../ui/HeatMapLegend";
import { TrendingUp, AlertCircle, MapPin, Clock } from "lucide-react";

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
  const [selectedHazard, setSelectedHazard] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("");

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
    if (selectedHazard) params.set("disaster_type", selectedHazard);
    if (minSeverity) params.set("min_severity", minSeverity);
    return params.toString();
  }, [from, to, disasterType, selectedHazard, minSeverity, granularity, timeField]);

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
  const satelliteTileUrl =
    climateData?.satellite_tiles?.[0]?.url ||
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  const satelliteAttribution =
    climateData?.satellite_tiles?.[0]?.attribution || "&copy; ESRI World Imagery";

  const lineData = (timeline?.total_by_period ?? []).map((p) => ({
    x: p.period ?? "",
    count: p.count,
  }));

  const hazards = [
    {
      type: "drought" as const,
      label: "Drought",
      count: mapMarkers.filter((m) => (m.properties as any)?.disaster_type?.toLowerCase() === "drought").length,
    },
    {
      type: "floods" as const,
      label: "Floods",
      count: mapMarkers.filter((m) => (m.properties as any)?.disaster_type?.toLowerCase() === "floods").length,
    },
    {
      type: "crops" as const,
      label: "Agriculture",
      count: mapMarkers.filter((m) => (m.properties as any)?.disaster_type?.toLowerCase() === "crop").length,
    },
    {
      type: "heat" as const,
      label: "Heat Stress",
      count: mapMarkers.filter((m) => (m.properties as any)?.disaster_type?.toLowerCase() === "heat").length,
    },
    {
      type: "conflicts" as const,
      label: "Conflicts",
      count: mapMarkers.filter((m) => (m.properties as any)?.disaster_type?.toLowerCase() === "conflict").length,
    },
    {
      type: "disease" as const,
      label: "Disease",
      count: mapMarkers.filter((m) => (m.properties as any)?.disaster_type?.toLowerCase() === "disease").length,
    },
  ];

  const totalIncidents = mapMarkers.length;
  const criticalAlerts = warningMarkers.filter((m) => {
    const risk = (m.properties as any)?.risk_level;
    return risk === "extreme" || risk === "catastrophic";
  }).length;

  return (
    <div className="min-h-screen bg-slate-950">
      <HeroSection />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Explore Data Section */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Explore Our Data</h2>
            <p className="text-slate-400">Click on a hazard type to explore related incidents and analysis</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hazards.map((hazard) => (
              <HazardCard
                key={hazard.type}
                type={hazard.type}
                count={hazard.count}
                severity={hazard.count > 50 ? "extreme" : hazard.count > 30 ? "high" : hazard.count > 10 ? "moderate" : "low"}
                onClick={() => {
                  setSelectedHazard(hazard.label);
                  window.scrollTo({ top: document.getElementById("map")?.offsetTop || 0, behavior: "smooth" });
                }}
              />
            ))}
          </div>
        </section>

        {/* Key Statistics */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">Current Status</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Incidents"
              value={totalIncidents}
              icon={<MapPin className="w-5 h-5" />}
              trend={totalIncidents > 100 ? "up" : "stable"}
              trendValue={totalIncidents > 100 ? "+15%" : "Stable"}
            />
            <StatCard
              label="Critical Alerts"
              value={criticalAlerts}
              icon={<AlertCircle className="w-5 h-5" />}
              trend={criticalAlerts > 5 ? "up" : "down"}
              trendValue={criticalAlerts > 5 ? "High" : "Low"}
            />
            <StatCard label="Data Sources" value="15" icon={<TrendingUp className="w-5 h-5" />} />
            <StatCard
              label="Last Updated"
              value="Now"
              icon={<Clock className="w-5 h-5" />}
              trend="stable"
              trendValue="Real-time"
            />
          </div>
        </section>

        {/* Filters */}
        <section className="mb-8">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Refine Your Search</h3>
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
        </section>

        {error && (
          <div className="mb-6 rounded-lg border border-red-700 bg-red-950/30 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Timeline Chart */}
        <section className="mb-16">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Incident Trend</h3>
                <p className="text-sm text-slate-400">Historical incident volume over time</p>
              </div>
              <div className="text-xs text-slate-400">{busy ? "Updating..." : "Live"}</div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <XAxis dataKey="x" tick={{ fill: "#cbd5e1", fontSize: 10 }} minTickGap={10} />
                  <YAxis tick={{ fill: "#cbd5e1" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Map Section with Heat Stress Visualization */}
        <section className="mb-16" id="map">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">Explore Our Data</h2>
            <p className="text-slate-400">
              Interactive heat stress and disaster type mapping across the region
            </p>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Regional Heat Stress Map</h3>
                <p className="text-sm text-slate-400">
                  Click on hazard types or regions to explore incidents
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSatellite((current) => !current)}
                className="rounded-lg border border-slate-600 bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-slate-200 transition"
              >
                {showSatellite ? "Satellite View" : "Map View"}
              </button>
            </div>

            {/* Map with Sidebar Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Sidebar - Filters and Legend */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <HeatMapLegend
                  selectedFilter={selectedFilter}
                  onFilterChange={setSelectedFilter}
                />
              </div>

              {/* Main Map Area */}
              <div className="lg:col-span-3">
                <div className="h-[600px] w-full overflow-hidden rounded-lg border border-slate-700">
                  <MapContainer
                    center={[7.5, 31.6]}
                    zoom={6}
                    style={{ height: "100%", width: "100%" }}
                  >
                    {showSatellite ? (
                      <TileLayer
                        url={satelliteTileUrl}
                        attribution={satelliteAttribution}
                      />
                    ) : (
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                      />
                    )}

                    {mapMarkers.map((f, idx) => {
                      const coords = f.geometry?.coordinates as
                        | [number, number]
                        | undefined;
                      if (!coords) return null;
                      const lon = coords[0];
                      const lat = coords[1];
                      const p = f.properties as any;
                      const disasterType =
                        p?.disaster_type?.toLowerCase() ?? "";

                      // Filter based on selected filter
                      if (selectedFilter && selectedFilter !== "all") {
                        const filterMap: Record<string, string[]> = {
                          "extreme-rainfall": ["flood", "rainfall"],
                          drought: ["drought"],
                          agriculture: ["crop", "agriculture"],
                          "heat-stress": ["heat", "heatstress"],
                          conflict: ["conflict"],
                        };
                        const allowedTypes = filterMap[selectedFilter] || [];
                        if (
                          !allowedTypes.some((t) => disasterType.includes(t))
                        ) {
                          return null;
                        }
                      }

                      const color = riskColor(p?.risk_level);
                      const weight = Math.min(16, 5 + Number(p?.count ?? 1));
                      return (
                        <CircleMarker
                          key={`m-${idx}`}
                          center={[lat, lon]}
                          pathOptions={{
                            color,
                            fillColor: color,
                            fillOpacity: 0.35,
                            weight: 3,
                          }}
                          radius={weight}
                        >
                          <Popup>
                            <div className="text-sm">
                              <div className="font-semibold">
                                {p?.name ?? "Unknown"}
                              </div>
                              <div className="text-xs text-gray-600">
                                {p?.disaster_type}
                              </div>
                              <div className="text-xs text-gray-600">
                                Risk: {p?.risk_level}
                              </div>
                              {p?.heat_index && (
                                <div className="text-xs text-gray-600">
                                  Heat Index: {p.heat_index}°C
                                </div>
                              )}
                              {p?.count && (
                                <div className="text-xs text-gray-600">
                                  Reports: {p.count}
                                </div>
                              )}
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>
                </div>

                {/* Heat Stress Legend Below Map */}
                <div className="mt-6 p-4 rounded-lg border border-slate-700 bg-slate-800/30">
                  <h4 className="text-sm font-semibold text-white mb-3">
                    {selectedFilter === "conflict" && "Conflict Risk Scale"}
                    {selectedFilter === "drought" && "Drought Severity Scale"}
                    {selectedFilter === "extreme-rainfall" && "Rainfall Intensity Scale"}
                    {selectedFilter === "agriculture" && "Agricultural Impact Scale"}
                    {selectedFilter === "heat-stress" && "Heat Stress Temperature Scale"}
                    {!selectedFilter && "Heat Stress Temperature Scale"}
                  </h4>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {(() => {
                      const scaleMap: Record<string, Array<{ label: string; color: string; value?: number }>> = {
                        conflict: conflictLevels,
                        drought: droughtLevels,
                        "extreme-rainfall": rainfallLevels,
                        agriculture: agricultureLevels,
                        "heat-stress": heatStressLevels,
                        default: heatStressLevels,
                      };
                      const currentScale = scaleMap[selectedFilter] || scaleMap.default;
                      return currentScale.map(({ label, color }) => (
                        <div key={label} className="flex flex-col items-center gap-1">
                          <div
                            className="w-8 h-8 rounded border border-slate-600 cursor-pointer hover:border-slate-400 transition"
                            style={{ backgroundColor: color }}
                            title={label}
                          />
                          <span className="text-xs text-slate-400 text-center">
                            {label.split(" ")[0]}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Early Warnings Section */}
        <section id="alerts" className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">Active Alerts</h2>
            <p className="text-slate-400">Recent warnings based on incident concentration and severity</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {warningMarkers.length === 0 ? (
              <div className="lg:col-span-2 rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center">
                <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No active warnings for the selected period</p>
              </div>
            ) : (
              warningMarkers.slice(0, 10).map((f, idx) => {
                const p = f.properties as any;
                const risk = p?.risk_level;
                const color = riskColor(risk);
                return (
                  <div
                    key={`${p?.location_id ?? "x"}-${idx}`}
                    className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 hover:border-slate-600 transition"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{p?.name ?? "Unknown location"}</h4>
                        <p className="text-sm text-slate-400">{p?.state}</p>
                      </div>
                      <div className="px-3 py-1 rounded-full text-xs font-semibold border" style={{ color, borderColor: color }}>
                        {(risk ?? "low").charAt(0).toUpperCase() + (risk ?? "low").slice(1)}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-slate-400">
                        <span>Recent Reports:</span>
                        <span className="text-white font-semibold">{p?.count_recent ?? 0}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Incident Type:</span>
                        <span className="text-white font-semibold">{p?.disaster_type || "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Climate & Data Section */}
        <section className="mb-16">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Climate & Environmental Data</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-white mb-4">Climate Summary</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {climateData
                    ? climateData.summary
                    : "Climate indicators are being analyzed from satellite and ground-based sensors across South Sudan."}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-4">Key Indicators</h4>
                <div className="space-y-3">
                  {(climateData?.indicators ?? []).slice(0, 4).map((indicator) => (
                    <div key={indicator.name} className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">{indicator.name}</span>
                      <span className="font-semibold text-white">
                        {indicator.value} {indicator.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Section */}
        <section className="py-12 border-t border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-white mb-4">About This Platform</h4>
              <p className="text-sm text-slate-400">
                A comprehensive hazard monitoring system for South Sudan providing real-time situational awareness of
                natural disasters and emergencies.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Data Sources</h4>
              <ul className="text-sm text-slate-400 space-y-2">
                <li>Satellite Imagery (ESRI, Sentinel)</li>
                <li>Community Reports</li>
                <li>Climate Models</li>
                <li>Ground Sensors</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Contact & Support</h4>
              <ul className="text-sm text-slate-400 space-y-2">
                <li>Email: alerts@disasterwatch.ss</li>
                <li>Hotline: +211 XXX XXXX</li>
                <li>Help: support@disasterwatch.ss</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-700 text-center text-sm text-slate-500">
            <p>&copy; 2026 South Sudan Hazards Watch. All Rights Reserved.</p>
          </div>
        </section>
      </div>
    </div>
  );
}


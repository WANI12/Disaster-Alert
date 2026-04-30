import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { apiFetch } from "../api/client";
import { GeoJSONFeatureCollection, TimelinePayload } from "../ui/types";
import { TrendingUp, AlertCircle, BarChart3, PieChart as PieChartIcon } from "lucide-react";

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

export default function DataAnalysisPage() {
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(todayIsoDate());
  const [disasterType, setDisasterType] = useState<string>("");

  const [timeline, setTimeline] = useState<TimelinePayload | null>(null);
  const [mapData, setMapData] = useState<GeoJSONFeatureCollection | null>(null);
  const [earlyWarning, setEarlyWarning] = useState<GeoJSONFeatureCollection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("from", from);
    params.set("to", to);
    if (disasterType) params.set("disaster_type", disasterType);
    return params.toString();
  }, [from, to, disasterType]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setBusy(true);
      setError(null);
      try {
        const [t, m, e] = await Promise.all([
          apiFetch<TimelinePayload>(`/analytics/timeline/?${query}`),
          apiFetch<GeoJSONFeatureCollection>(`/analytics/map/?${query}`),
          apiFetch<GeoJSONFeatureCollection>(
            `/analytics/early-warning/?${query}&window_days=7&threshold_count=3&format=geojson`,
          ),
        ]);
        if (!cancelled) {
          setTimeline(t);
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

  // Process incident data
  const incidents = mapData?.features ?? [];
  const warnings = earlyWarning?.features ?? [];
  const timelineData = (timeline?.total_by_period ?? []).map((p) => ({
    period: p.period ?? "Unknown",
    count: p.count,
    avgSeverity: p.avg_severity ?? 0,
  }));

  // Disaster type distribution
  const disasterTypeMap = new Map<string, number>();
  incidents.forEach((f) => {
    const type = ((f.properties as any)?.disaster_type ?? "Unknown").toLowerCase();
    disasterTypeMap.set(type, (disasterTypeMap.get(type) ?? 0) + 1);
  });
  const disasterTypeData = Array.from(disasterTypeMap, ([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Severity distribution
  const severityMap = new Map<string, number>();
  incidents.forEach((f) => {
    const level = (f.properties as any)?.risk_level ?? "low";
    severityMap.set(level, (severityMap.get(level) ?? 0) + 1);
  });
  const severityData = Array.from(severityMap, ([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: riskColor(name),
  }));

  // Early warnings by risk level
  const warningRiskMap = new Map<string, number>();
  warnings.forEach((f) => {
    const risk = (f.properties as any)?.risk_level ?? "low";
    warningRiskMap.set(risk, (warningRiskMap.get(risk) ?? 0) + 1);
  });
  const warningRiskData = Array.from(warningRiskMap, ([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: riskColor(name),
  }));

  // Incident reports by type over time
  const typeTimelineMap = new Map<string, Map<string, number>>();
  (timeline?.by_type ?? {}) as Record<string, Array<{ period: string | null; count: number }>>;
  timelineData.forEach((point) => {
    if (!typeTimelineMap.has(point.period)) {
      typeTimelineMap.set(point.period, new Map());
    }
  });

  // Statistics
  const totalIncidents = incidents.length;
  const totalWarnings = warnings.length;
  const criticalAlerts = warnings.filter((w) => {
    const risk = (w.properties as any)?.risk_level;
    return risk === "extreme" || risk === "catastrophic";
  }).length;
  const avgSeverity = incidents.length > 0
    ? (
        incidents.reduce((sum, f) => {
          const severity = (f.properties as any)?.risk_level ?? "low";
          const severityMap: Record<string, number> = {
            catastrophic: 5,
            extreme: 4,
            high: 3,
            moderate: 2,
            low: 1,
          };
          return sum + (severityMap[severity] ?? 1);
        }, 0) / incidents.length
      ).toFixed(2)
    : "0";

  const COLORS = ["#06b6d4", "#f43f5e", "#f97316", "#22c55e", "#3b82f6", "#8b5cf6"];

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header Section */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Data Analysis</h1>
          <p className="text-slate-400">
            Comprehensive analysis of incident reports and early warning data
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filter Section */}
        <section className="mb-8">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Disaster Type
                </label>
                <select
                  value={disasterType}
                  onChange={(e) => setDisasterType(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Types</option>
                  <option value="drought">Drought</option>
                  <option value="flood">Flood</option>
                  <option value="heat">Heat Stress</option>
                  <option value="conflict">Conflict</option>
                  <option value="disease">Disease</option>
                  <option value="crop">Agriculture</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  disabled={busy}
                  className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 px-4 py-2 text-white text-sm font-medium transition"
                >
                  {busy ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-lg border border-red-700 bg-red-950/30 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-400">Total Incidents</h4>
                <TrendingUp className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-3xl font-bold text-white">{totalIncidents}</p>
              <p className="text-xs text-slate-400 mt-2">Reported incidents</p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-400">Total Warnings</h4>
                <AlertCircle className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-3xl font-bold text-white">{totalWarnings}</p>
              <p className="text-xs text-slate-400 mt-2">Active early warnings</p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-400">Critical Alerts</h4>
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-3xl font-bold text-white">{criticalAlerts}</p>
              <p className="text-xs text-slate-400 mt-2">Extreme/Catastrophic</p>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-400">Avg Severity</h4>
                <BarChart3 className="w-5 h-5 text-cyan-400" />
              </div>
              <p className="text-3xl font-bold text-white">{avgSeverity}</p>
              <p className="text-xs text-slate-400 mt-2">Out of 5</p>
            </div>
          </div>
        </section>

        {/* Charts Section - Incidents */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <PieChartIcon className="w-6 h-6" />
            Incident Reports Analysis
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Disaster Type Distribution */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Distribution by Disaster Type</h3>
              <div className="h-80">
                {disasterTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={disasterTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) =>
                          `${name}: ${value}`
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {disasterTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Distribution by Risk Level</h3>
              <div className="h-80">
                {severityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={severityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#cbd5e1" }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                        labelStyle={{ color: "#e2e8f0" }}
                      />
                      <Bar dataKey="value" fill="#06b6d4">
                        {severityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Chart */}
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Incident Trend Over Time</h3>
            <div className="h-80">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="period"
                      tick={{ fill: "#cbd5e1", fontSize: 10 }}
                      minTickGap={10}
                    />
                    <YAxis tick={{ fill: "#cbd5e1" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b" }}
                      labelStyle={{ color: "#e2e8f0" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={false}
                      name="Incident Count"
                    />
                    <Line
                      type="monotone"
                      dataKey="avgSeverity"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                      name="Avg Severity"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  No data available
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Charts Section - Early Warnings */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Early Warning Analysis
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Warning Risk Distribution */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Warnings by Risk Level</h3>
              <div className="h-80">
                {warningRiskData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={warningRiskData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) =>
                          `${name}: ${value}`
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {warningRiskData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No warnings available
                  </div>
                )}
              </div>
            </div>

            {/* Warning Statistics Table */}
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Warning Summary</h3>
              <div className="space-y-4">
                {warningRiskData.length > 0 ? (
                  warningRiskData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 border border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-300">{item.name} Risk</span>
                      </div>
                      <span className="text-lg font-semibold text-white">
                        {item.value} warning{item.value !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    No early warnings for the selected period
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Warning Details */}
          {warnings.length > 0 && (
            <div className="mt-6 rounded-lg border border-slate-700 bg-slate-800/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Warnings</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {warnings.slice(0, 10).map((warning, idx) => {
                  const props = warning.properties as any;
                  const risk = props?.risk_level ?? "low";
                  return (
                    <div
                      key={idx}
                      className="flex items-start justify-between p-4 rounded-lg bg-slate-700/20 border border-slate-700 hover:border-slate-600 transition"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{props?.name || "Unknown"}</h4>
                        <p className="text-sm text-slate-400">
                          {props?.disaster_type || "Unknown Type"} •{" "}
                          {props?.count_recent || 0} recent reports
                        </p>
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-xs font-semibold border"
                        style={{
                          color: riskColor(risk),
                          borderColor: riskColor(risk),
                        }}
                      >
                        {risk.toUpperCase()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

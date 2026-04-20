import React from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
}

export default function StatCard({ label, value, unit, icon, trend, trendValue }: StatCardProps) {
  const trendConfig = {
    up: { color: "text-red-400", bg: "bg-red-500/10" },
    down: { color: "text-green-400", bg: "bg-green-500/10" },
    stable: { color: "text-slate-400", bg: "bg-slate-500/10" },
  };

  const trendStyle = trend ? trendConfig[trend] : null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 hover:border-slate-600 transition">
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium text-slate-400">{label}</span>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>

      <div className="mb-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        {unit && <span className="text-sm text-slate-400 ml-2">{unit}</span>}
      </div>

      {trend && trendValue && trendStyle && (
        <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${trendStyle.bg} ${trendStyle.color}`}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
        </div>
      )}
    </div>
  );
}

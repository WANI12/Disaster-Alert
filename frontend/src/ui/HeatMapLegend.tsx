import React from "react";
import { Cloud, Droplets, Leaf, Flame, Swords } from "lucide-react";

export interface HeatMapLegendProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

export const heatStressLevels = [
  { label: "29.0°C", color: "#3b82f6", value: 29 },
  { label: "30°C", color: "#06b6d4", value: 30 },
  { label: "34°C", color: "#facc15", value: 34 },
  { label: "36°C", color: "#f59e0b", value: 36 },
  { label: "38°C", color: "#fb923c", value: 38 },
  { label: "40°C", color: "#f97316", value: 40 },
  { label: "44.0°C", color: "#ea580c", value: 44 },
  { label: "47°C", color: "#dc2626", value: 47 },
  { label: "50°C", color: "#991b1b", value: 50 },
  { label: "53°C", color: "#7c2d12", value: 53 },
];

const hazardFilters = [
  {
    id: "extreme-rainfall",
    label: "Extreme Rainfall",
    icon: Cloud,
    color: "text-blue-400",
  },
  {
    id: "drought",
    label: "Drought",
    icon: Droplets,
    color: "text-orange-400",
  },
  {
    id: "agriculture",
    label: "Agriculture",
    icon: Leaf,
    color: "text-green-400",
  },
  {
    id: "heat-stress",
    label: "Heat Stress",
    icon: Flame,
    color: "text-red-400",
  },
  {
    id: "conflict",
    label: "Conflict",
    icon: Swords,
    color: "text-red-600",
  },
];

export default function HeatMapLegend({
  selectedFilter,
  onFilterChange,
}: HeatMapLegendProps) {
  return (
    <div className="flex flex-col gap-8">
      {/* Filters */}
      <div className="flex flex-col gap-4">
        {hazardFilters.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => onFilterChange(id === selectedFilter ? "" : id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition ${
              selectedFilter === id
                ? "border-slate-500 bg-slate-700/50"
                : "border-slate-600 bg-slate-800/50 hover:border-slate-500"
            }`}
          >
            <Icon className={`w-5 h-5 ${color}`} />
            <span className="text-sm font-medium text-slate-200">{label}</span>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          Heat Stress Scale
        </h4>
        <div className="flex flex-col gap-2">
          {heatStressLevels.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border border-slate-600"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

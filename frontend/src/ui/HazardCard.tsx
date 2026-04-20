import React from "react";
import { Cloud, Droplets, Leaf, Wind, AlertTriangle, FlameIcon } from "lucide-react";

export interface HazardCardProps {
  type: "drought" | "floods" | "crops" | "heat" | "conflicts" | "disease";
  count: number;
  severity: "low" | "moderate" | "high" | "extreme";
  onClick?: () => void;
}

const hazardConfig = {
  drought: {
    icon: Cloud,
    label: "Drought",
    color: "bg-yellow-500/10 border-yellow-500/20 hover:border-yellow-500/40",
    badgeColor: "bg-yellow-500/20 text-yellow-300",
    description: "Water scarcity and dry conditions",
  },
  floods: {
    icon: Droplets,
    label: "Floods",
    color: "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40",
    badgeColor: "bg-blue-500/20 text-blue-300",
    description: "Heavy rainfall and flooding events",
  },
  crops: {
    icon: Leaf,
    label: "Agriculture",
    color: "bg-green-500/10 border-green-500/20 hover:border-green-500/40",
    badgeColor: "bg-green-500/20 text-green-300",
    description: "Crop failures and agricultural impact",
  },
  heat: {
    icon: Wind,
    label: "Heat Stress",
    color: "bg-red-500/10 border-red-500/20 hover:border-red-500/40",
    badgeColor: "bg-red-500/20 text-red-300",
    description: "Extreme temperatures and heat waves",
  },
  conflicts: {
    icon: AlertTriangle,
    label: "Conflicts",
    color: "bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40",
    badgeColor: "bg-orange-500/20 text-orange-300",
    description: "Conflict incidents and unrest",
  },
  disease: {
    icon: FlameIcon,
    label: "Disease Outbreak",
    color: "bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40",
    badgeColor: "bg-purple-500/20 text-purple-300",
    description: "Disease and epidemic events",
  },
};

const severityConfig = {
  low: { bg: "bg-blue-500", text: "text-blue-300" },
  moderate: { bg: "bg-yellow-500", text: "text-yellow-300" },
  high: { bg: "bg-orange-500", text: "text-orange-300" },
  extreme: { bg: "bg-red-500", text: "text-red-300" },
};

export default function HazardCard({ type, count, severity, onClick }: HazardCardProps) {
  const config = hazardConfig[type];
  const Icon = config.icon;
  const severityStyle = severityConfig[severity];

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-lg border p-6 transition-all duration-300 text-left ${config.color}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition"></div>

      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${config.badgeColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${severityStyle.bg}`}>
          {severity.charAt(0).toUpperCase() + severity.slice(1)}
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-2">{config.label}</h3>
      <p className="text-sm text-slate-400 mb-4">{config.description}</p>

      <div className="flex items-end justify-between pt-4 border-t border-white/10">
        <span className="text-xs text-slate-400">Active incidents</span>
        <span className="text-3xl font-bold text-white">{count}</span>
      </div>
    </button>
  );
}

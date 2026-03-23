import React from "react";

type Props = {
  from: string;
  to: string;
  disasterType: string;
  state: string;
  minSeverity: string;
  granularity: string;
  timeField: "occurred_at" | "created_at";
  onChange: (next: {
    from: string;
    to: string;
    disasterType: string;
    state: string;
    minSeverity: string;
    granularity: string;
    timeField: "occurred_at" | "created_at";
  }) => void;
};

const PRESETS: Array<{ label: string; from?: string; to?: string }> = [
  { label: "Early 2000s", from: "2000-01-01", to: "2005-12-31" },
  { label: "Last 30 days" },
  { label: "Last 7 days" },
];

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function shiftDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function FilterBar(props: Props) {
  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    if (preset.label.includes("Last 30")) {
      props.onChange({
        ...props,
        from: shiftDays(30),
        to: todayIsoDate(),
      });
      return;
    }
    if (preset.label.includes("Last 7")) {
      props.onChange({
        ...props,
        from: shiftDays(7),
        to: todayIsoDate(),
      });
      return;
    }
    props.onChange({ ...props, from: preset.from ?? props.from, to: preset.to ?? props.to });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-200 hover:bg-slate-950/60"
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
        <div className="ml-auto text-xs text-slate-400">Time window: `from` to `to`</div>
      </div>

      <div className="grid gap-3 md:grid-cols-7">
        <label className="block md:col-span-2">
          <div className="mb-1 text-xs text-slate-400">From</div>
          <input
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            type="date"
            value={props.from}
            onChange={(e) => props.onChange({ ...props, from: e.target.value })}
          />
        </label>
        <label className="block md:col-span-2">
          <div className="mb-1 text-xs text-slate-400">To</div>
          <input
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            type="date"
            value={props.to}
            onChange={(e) => props.onChange({ ...props, to: e.target.value })}
          />
        </label>
        <label className="block md:col-span-1">
          <div className="mb-1 text-xs text-slate-400">Disaster</div>
          <select
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            value={props.disasterType}
            onChange={(e) => props.onChange({ ...props, disasterType: e.target.value })}
          >
            <option value="">All</option>
            <option value="Flood">Flood</option>
            <option value="Fire">Fire</option>
            <option value="Conflict">Conflict</option>
            <option value="Disease Outbreak">Disease Outbreak</option>
            <option value="Drought">Drought</option>
            <option value="Landslide">Landslide</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label className="block md:col-span-1">
          <div className="mb-1 text-xs text-slate-400">State</div>
          <input
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            value={props.state}
            onChange={(e) => props.onChange({ ...props, state: e.target.value })}
            placeholder="e.g. Jonglei"
          />
        </label>
        <label className="block md:col-span-1">
          <div className="mb-1 text-xs text-slate-400">Min severity</div>
          <select
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            value={props.minSeverity}
            onChange={(e) => props.onChange({ ...props, minSeverity: e.target.value })}
          >
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </label>
        <label className="block md:col-span-2">
          <div className="mb-1 text-xs text-slate-400">Granularity</div>
          <select
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            value={props.granularity}
            onChange={(e) => props.onChange({ ...props, granularity: e.target.value })}
          >
            <option value="auto">Auto</option>
            <option value="day">Day</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </label>
        <label className="block md:col-span-1">
          <div className="mb-1 text-xs text-slate-400">Time field</div>
          <select
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            value={props.timeField}
            onChange={(e) => props.onChange({ ...props, timeField: e.target.value as any })}
          >
            <option value="occurred_at">Occurred</option>
            <option value="created_at">Created</option>
          </select>
        </label>
      </div>
    </div>
  );
}


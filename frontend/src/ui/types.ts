export type GeoJSONFeatureCollection = {
  type: "FeatureCollection";
  from: string;
  to: string;
  time_field?: string;
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: Record<string, unknown>;
  }>;
};

export type TimelinePoint = {
  period: string | null;
  count: number;
  avg_severity: number | null;
  max_severity: number;
};

export type TimelinePayload = {
  from: string;
  to: string;
  granularity: string;
  time_field: string;
  total_by_period: TimelinePoint[];
  by_type?: Record<string, Array<{ period: string | null; count: number }>>;
};

export type ClimateIndicator = {
  name: string;
  value: string;
  unit: string;
};

export type ClimatePayload = {
  region: string;
  source: string;
  from: string;
  to: string;
  summary: string;
  indicators: ClimateIndicator[];
  satellite_tiles: Array<{
    name: string;
    url: string;
    attribution: string;
  }>;
  markers: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: Record<string, unknown>;
  }>;
};


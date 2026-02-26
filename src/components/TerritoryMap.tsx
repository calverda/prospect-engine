"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface LeadInfo {
  id: string;
  businessName: string;
  industry: string;
  status: string;
  websiteUrl: string | null;
}

interface ZipCluster {
  zip: string;
  lat: number;
  lng: number;
  city: string;
  leads: LeadInfo[];
}

const INDUSTRY_COLORS: Record<string, string> = {
  hvac: "#EF4444",
  general_contractor: "#3B82F6",
  masonry: "#8B5CF6",
  fence: "#10B981",
  solar: "#F59E0B",
  pool: "#06B6D4",
  plumbing: "#EC4899",
  electrician: "#F97316",
  paving: "#6B7280",
  windows_doors: "#14B8A6",
  pest_control: "#84CC16",
  landscaping: "#22C55E",
  dental: "#A855F7",
  behavioral_health: "#E879F9",
  church: "#7C3AED",
  school: "#2563EB",
  local_government: "#0EA5E9",
};

const INDUSTRY_LABELS: Record<string, string> = {
  hvac: "HVAC",
  general_contractor: "General Contractor",
  masonry: "Masonry",
  fence: "Fencing",
  solar: "Solar",
  pool: "Pool",
  plumbing: "Plumbing",
  electrician: "Electrical",
  paving: "Paving",
  windows_doors: "Windows & Doors",
  pest_control: "Pest Control",
  landscaping: "Landscaping",
  dental: "Dental",
  behavioral_health: "Behavioral Health",
  church: "Church",
  school: "School",
  local_government: "Local Government",
};

function dominantIndustry(leads: LeadInfo[]): string {
  const counts: Record<string, number> = {};
  for (const l of leads) {
    counts[l.industry] = (counts[l.industry] || 0) + 1;
  }
  let max = "";
  let maxCount = 0;
  for (const [k, v] of Object.entries(counts)) {
    if (v > maxCount) {
      max = k;
      maxCount = v;
    }
  }
  return max;
}

function getColor(industry: string): string {
  return INDUSTRY_COLORS[industry] ?? "#9CA3AF";
}

export function TerritoryMap() {
  const [clusters, setClusters] = useState<ZipCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/territory")
      .then((r) => r.json())
      .then((data) => {
        setClusters(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Collect all industries present in the data
  const industriesInData = Array.from(
    new Set(clusters.flatMap((c) => c.leads.map((l) => l.industry)))
  ).sort();

  const filtered =
    filter === "all"
      ? clusters
      : clusters
          .map((c) => ({
            ...c,
            leads: c.leads.filter((l) => l.industry === filter),
          }))
          .filter((c) => c.leads.length > 0);

  const totalLeads = filtered.reduce((sum, c) => sum + c.leads.length, 0);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-zinc-400">Loading territory data...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Controls bar */}
      <div className="flex items-center gap-4 border-b bg-white px-4 py-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border px-3 py-1.5 text-sm"
        >
          <option value="all">All Industries</option>
          {industriesInData.map((ind) => (
            <option key={ind} value={ind}>
              {INDUSTRY_LABELS[ind] ?? ind}
            </option>
          ))}
        </select>
        <span className="text-xs text-zinc-400">
          {totalLeads} leads across {filtered.length} zip codes
        </span>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapContainer
          center={[40.75, -73.2]}
          zoom={10}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filtered.map((cluster) => {
            const dominant = dominantIndustry(cluster.leads);
            const color = getColor(dominant);
            const radius = Math.min(8 + cluster.leads.length * 2, 24);

            return (
              <CircleMarker
                key={cluster.zip}
                center={[cluster.lat, cluster.lng]}
                radius={radius}
                pathOptions={{
                  fillColor: color,
                  color: "#fff",
                  weight: 2,
                  fillOpacity: 0.85,
                }}
              >
                <Popup maxWidth={300}>
                  <div className="max-h-64 overflow-y-auto">
                    <p className="mb-1 font-semibold">
                      {cluster.city} — {cluster.zip}
                    </p>
                    <p className="mb-2 text-xs text-zinc-500">
                      {cluster.leads.length} lead
                      {cluster.leads.length !== 1 ? "s" : ""}
                    </p>
                    <ul className="space-y-1">
                      {cluster.leads.map((lead) => (
                        <li key={lead.id} className="text-xs">
                          <span className="font-medium">
                            {lead.businessName}
                          </span>
                          <span
                            className="ml-1.5 inline-block rounded-full px-1.5 py-0.5 text-white"
                            style={{
                              backgroundColor: getColor(lead.industry),
                              fontSize: "9px",
                            }}
                          >
                            {INDUSTRY_LABELS[lead.industry] ?? lead.industry}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 border-t bg-white px-4 py-2">
        {industriesInData.map((ind) => (
          <button
            key={ind}
            onClick={() => setFilter(filter === ind ? "all" : ind)}
            className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs transition ${
              filter === ind
                ? "ring-2 ring-zinc-400"
                : "opacity-80 hover:opacity-100"
            }`}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: getColor(ind) }}
            />
            {INDUSTRY_LABELS[ind] ?? ind}
          </button>
        ))}
      </div>
    </div>
  );
}

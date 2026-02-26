"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Prospect } from "@/lib/db/schema";
import type { IndustryKey } from "@/lib/pipeline/types";
import { formatDate } from "@/lib/utils/format";

const INDUSTRY_OPTIONS: { value: IndustryKey; label: string }[] = [
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrician", label: "Electrical" },
  { value: "landscaping", label: "Landscaping" },
  { value: "dental", label: "Dental" },
  { value: "behavioral_health", label: "Behavioral Health" },
  { value: "pest_control", label: "Pest Control" },
  { value: "general_contractor", label: "General Contractor" },
  { value: "masonry", label: "Masonry & Concrete" },
  { value: "fence", label: "Fencing" },
  { value: "solar", label: "Solar" },
  { value: "pool", label: "Pool Services" },
  { value: "paving", label: "Paving" },
  { value: "windows_doors", label: "Windows & Doors" },
  { value: "church", label: "Church / House of Worship" },
  { value: "school", label: "School / Education" },
  { value: "local_government", label: "Local Government" },
];

function industryLabel(value: string): string {
  return INDUSTRY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

interface LeadCardProps {
  prospect: Prospect;
}

export function LeadCard({ prospect }: LeadCardProps) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to start generation");
      const data = await res.json();
      window.location.href = `/prospect/${data.slug}`;
    } catch {
      alert("Failed to generate");
      setGenerating(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${prospect.businessName}"?`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/prospects/${prospect.id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      alert("Failed to delete");
      setDeleting(false);
    }
  }

  async function handleIndustryChange(newIndustry: string) {
    if (newIndustry === prospect.industry) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/prospects/${prospect.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry: newIndustry }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditing(false);
      router.refresh();
    } catch {
      alert("Failed to update industry");
    } finally {
      setSaving(false);
    }
  }

  const busy = generating || deleting || saving;

  return (
    <div className={`flex items-center justify-between rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-3 ${busy ? "opacity-50" : ""}`}>
      <div>
        <h3 className="font-medium text-sm">{prospect.businessName}</h3>
        <p className="text-xs text-zinc-400">
          {editing ? (
            <select
              value={prospect.industry}
              onChange={(e) => handleIndustryChange(e.target.value)}
              onBlur={() => setEditing(false)}
              autoFocus
              disabled={saving}
              className="rounded border border-zinc-300 bg-white px-1 py-0.5 text-xs text-zinc-700"
            >
              {INDUSTRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="underline decoration-dashed underline-offset-2 hover:text-zinc-600"
              title="Click to change industry"
            >
              {industryLabel(prospect.industry)}
            </button>
          )}
          {" "}&middot; {prospect.location} &middot; {formatDate(prospect.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleGenerate}
          disabled={busy}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {generating ? "Starting..." : "Generate"}
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="rounded p-1 text-zinc-300 hover:bg-red-50 hover:text-red-500"
          title="Delete lead"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

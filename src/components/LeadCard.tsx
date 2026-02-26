"use client";

import { useState } from "react";
import Link from "next/link";
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
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/prospect/${prospect.slug}`} className="font-medium text-sm truncate hover:text-blue-600 hover:underline">
            {prospect.businessName}
          </Link>
          {prospect.leadScore && prospect.leadScore !== "Skip" && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              prospect.leadScore === "Hot Lead" ? "bg-red-100 text-red-700" :
              prospect.leadScore === "Warm Lead" ? "bg-orange-100 text-orange-700" :
              "bg-blue-100 text-blue-700"
            }`}>
              {prospect.leadScore.replace(" Lead", "")}
            </span>
          )}
          {prospect.salesPriority === "High" && (
            <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
              High Priority
            </span>
          )}
          {prospect.redFlags && (
            <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700" title={prospect.redFlags}>
              Flag
            </span>
          )}
        </div>
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
          {" "}&middot; {prospect.location}
          {prospect.siteQuality && <> &middot; <span className={
            prospect.siteQuality === "No Website" || prospect.siteQuality === "Needs Overhaul" ? "text-red-500" :
            prospect.siteQuality === "Needs Update" ? "text-orange-500" : ""
          }>{prospect.siteQuality}</span></>}
        </p>
        {prospect.opportunityNotes && (
          <p className="text-xs text-zinc-400 mt-0.5 truncate" title={prospect.opportunityNotes}>
            {prospect.opportunityNotes}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-3 shrink-0">
        {prospect.contactEmail && (
          <a
            href={`mailto:${prospect.contactEmail}`}
            className="rounded p-1 text-zinc-300 hover:bg-blue-50 hover:text-blue-500"
            title={prospect.contactEmail}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
              <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
            </svg>
          </a>
        )}
        {prospect.phone && (
          <a
            href={`tel:${prospect.phone}`}
            className="rounded p-1 text-zinc-300 hover:bg-green-50 hover:text-green-500"
            title={prospect.phone}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
            </svg>
          </a>
        )}
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

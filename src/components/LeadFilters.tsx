"use client";

import { useState, useMemo } from "react";
import type { Prospect } from "@/lib/db/schema";
import { LeadCard } from "./LeadCard";

interface LeadFiltersProps {
  leads: Prospect[];
}

type ScoreFilter = "all" | "Hot Lead" | "Warm Lead" | "Cool Lead" | "Skip";
type PriorityFilter = "all" | "High" | "Medium" | "Low";
type SiteFilter = "all" | "No Website" | "Needs Overhaul" | "Needs Update" | "Acceptable" | "Well Maintained";

export function LeadFilters({ leads }: LeadFiltersProps) {
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [siteFilter, setSiteFilter] = useState<SiteFilter>("all");
  const [hideRedFlags, setHideRedFlags] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = leads;

    if (scoreFilter !== "all") {
      result = result.filter((l) => l.leadScore === scoreFilter);
    }
    if (priorityFilter !== "all") {
      result = result.filter((l) => l.salesPriority === priorityFilter);
    }
    if (siteFilter !== "all") {
      result = result.filter((l) => l.siteQuality === siteFilter);
    }
    if (hideRedFlags) {
      result = result.filter((l) => !l.redFlags);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.businessName.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q) ||
          l.industry.toLowerCase().includes(q)
      );
    }

    return result;
  }, [leads, scoreFilter, priorityFilter, siteFilter, hideRedFlags, search]);

  // Count badges
  const counts = useMemo(() => {
    const score: Record<string, number> = {};
    const priority: Record<string, number> = {};
    const site: Record<string, number> = {};
    let flagged = 0;
    for (const l of leads) {
      if (l.leadScore) score[l.leadScore] = (score[l.leadScore] ?? 0) + 1;
      if (l.salesPriority) priority[l.salesPriority] = (priority[l.salesPriority] ?? 0) + 1;
      if (l.siteQuality) site[l.siteQuality] = (site[l.siteQuality] ?? 0) + 1;
      if (l.redFlags) flagged++;
    }
    return { score, priority, site, flagged };
  }, [leads]);

  const hasFilters = scoreFilter !== "all" || priorityFilter !== "all" || siteFilter !== "all" || hideRedFlags || search.trim();

  return (
    <div className="space-y-3">
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search leads..."
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {/* Lead Score */}
        <select
          value={scoreFilter}
          onChange={(e) => setScoreFilter(e.target.value as ScoreFilter)}
          className={`rounded-full border px-3 py-1 text-xs ${scoreFilter !== "all" ? "border-blue-300 bg-blue-50 text-blue-700" : "border-zinc-300 bg-white text-zinc-600"}`}
        >
          <option value="all">All Scores</option>
          <option value="Hot Lead">Hot Lead ({counts.score["Hot Lead"] ?? 0})</option>
          <option value="Warm Lead">Warm Lead ({counts.score["Warm Lead"] ?? 0})</option>
          <option value="Cool Lead">Cool Lead ({counts.score["Cool Lead"] ?? 0})</option>
          <option value="Skip">Skip ({counts.score["Skip"] ?? 0})</option>
        </select>

        {/* Priority */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
          className={`rounded-full border px-3 py-1 text-xs ${priorityFilter !== "all" ? "border-green-300 bg-green-50 text-green-700" : "border-zinc-300 bg-white text-zinc-600"}`}
        >
          <option value="all">All Priorities</option>
          <option value="High">High ({counts.priority["High"] ?? 0})</option>
          <option value="Medium">Medium ({counts.priority["Medium"] ?? 0})</option>
          <option value="Low">Low ({counts.priority["Low"] ?? 0})</option>
        </select>

        {/* Site Quality */}
        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value as SiteFilter)}
          className={`rounded-full border px-3 py-1 text-xs ${siteFilter !== "all" ? "border-orange-300 bg-orange-50 text-orange-700" : "border-zinc-300 bg-white text-zinc-600"}`}
        >
          <option value="all">All Site Quality</option>
          <option value="No Website">No Website ({counts.site["No Website"] ?? 0})</option>
          <option value="Needs Overhaul">Needs Overhaul ({counts.site["Needs Overhaul"] ?? 0})</option>
          <option value="Needs Update">Needs Update ({counts.site["Needs Update"] ?? 0})</option>
          <option value="Acceptable">Acceptable ({counts.site["Acceptable"] ?? 0})</option>
          <option value="Well Maintained">Well Maintained ({counts.site["Well Maintained"] ?? 0})</option>
        </select>

        {/* Red flags toggle */}
        {counts.flagged > 0 && (
          <button
            onClick={() => setHideRedFlags(!hideRedFlags)}
            className={`rounded-full border px-3 py-1 text-xs ${hideRedFlags ? "border-red-300 bg-red-50 text-red-700" : "border-zinc-300 bg-white text-zinc-600"}`}
          >
            {hideRedFlags ? "Hiding" : "Hide"} Red Flags ({counts.flagged})
          </button>
        )}

        {hasFilters && (
          <button
            onClick={() => {
              setScoreFilter("all");
              setPriorityFilter("all");
              setSiteFilter("all");
              setHideRedFlags(false);
              setSearch("");
            }}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-zinc-400">
        Showing {filtered.length} of {leads.length} leads
        {filtered.length > 0 && leads[0]?.contactEmail && (
          <> &middot; {filtered.filter((l) => l.contactEmail).length} with email</>
        )}
      </p>

      {/* Lead list */}
      {filtered.length > 0 ? (
        <div className="grid gap-2">
          {filtered.map((lead) => (
            <LeadCard key={lead.id} prospect={lead} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-400 py-4 text-center">
          No leads match your filters.
        </p>
      )}
    </div>
  );
}

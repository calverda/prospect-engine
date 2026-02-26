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

  // Extra stats
  const withEmail = useMemo(() => leads.filter((l) => l.contactEmail).length, [leads]);
  const withPhone = useMemo(() => leads.filter((l) => l.phone).length, [leads]);
  const withWebsite = useMemo(() => leads.filter((l) => l.siteQuality && l.siteQuality !== "No Website").length, [leads]);

  // Industry breakdown
  const industries = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of leads) {
      map[l.industry] = (map[l.industry] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="rounded-lg border bg-white p-4 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-700">Lead Overview</h3>

        {/* Score breakdown — clickable */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setScoreFilter(scoreFilter === "Hot Lead" ? "all" : "Hot Lead")}
            className={`rounded-lg border p-3 text-center transition-colors ${scoreFilter === "Hot Lead" ? "border-red-300 bg-red-50" : "hover:bg-zinc-50"}`}
          >
            <p className="text-2xl font-bold text-red-600">{counts.score["Hot Lead"] ?? 0}</p>
            <p className="text-[10px] font-medium text-red-600">Hot Leads</p>
          </button>
          <button
            onClick={() => setScoreFilter(scoreFilter === "Warm Lead" ? "all" : "Warm Lead")}
            className={`rounded-lg border p-3 text-center transition-colors ${scoreFilter === "Warm Lead" ? "border-orange-300 bg-orange-50" : "hover:bg-zinc-50"}`}
          >
            <p className="text-2xl font-bold text-orange-600">{counts.score["Warm Lead"] ?? 0}</p>
            <p className="text-[10px] font-medium text-orange-600">Warm Leads</p>
          </button>
          <button
            onClick={() => setScoreFilter(scoreFilter === "Cool Lead" ? "all" : "Cool Lead")}
            className={`rounded-lg border p-3 text-center transition-colors ${scoreFilter === "Cool Lead" ? "border-blue-300 bg-blue-50" : "hover:bg-zinc-50"}`}
          >
            <p className="text-2xl font-bold text-blue-600">{counts.score["Cool Lead"] ?? 0}</p>
            <p className="text-[10px] font-medium text-blue-600">Cool Leads</p>
          </button>
          <button
            onClick={() => setScoreFilter(scoreFilter === "Skip" ? "all" : "Skip")}
            className={`rounded-lg border p-3 text-center transition-colors ${scoreFilter === "Skip" ? "border-zinc-400 bg-zinc-100" : "hover:bg-zinc-50"}`}
          >
            <p className="text-2xl font-bold text-zinc-400">{counts.score["Skip"] ?? 0}</p>
            <p className="text-[10px] font-medium text-zinc-400">Skip</p>
          </button>
        </div>

        {/* Contact & site stats */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          <div className="text-center">
            <p className="text-lg font-bold">{withEmail}</p>
            <p className="text-[10px] text-zinc-500">Have Email</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{withPhone}</p>
            <p className="text-[10px] text-zinc-500">Have Phone</p>
          </div>
          <button
            onClick={() => setSiteFilter(siteFilter === "No Website" ? "all" : "No Website")}
            className={`text-center rounded transition-colors ${siteFilter === "No Website" ? "bg-red-50" : "hover:bg-zinc-50"}`}
          >
            <p className="text-lg font-bold text-red-600">{counts.site["No Website"] ?? 0}</p>
            <p className="text-[10px] text-zinc-500">No Website</p>
          </button>
          <button
            onClick={() => setSiteFilter(siteFilter === "Needs Overhaul" ? "all" : "Needs Overhaul")}
            className={`text-center rounded transition-colors ${siteFilter === "Needs Overhaul" ? "bg-orange-50" : "hover:bg-zinc-50"}`}
          >
            <p className="text-lg font-bold text-orange-600">{(counts.site["Needs Overhaul"] ?? 0) + (counts.site["Needs Update"] ?? 0)}</p>
            <p className="text-[10px] text-zinc-500">Need Work</p>
          </button>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">{counts.priority["High"] ?? 0}</p>
            <p className="text-[10px] text-zinc-500">High Priority</p>
          </div>
        </div>

        {/* Industry breakdown */}
        {industries.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {industries.map(([industry, count]) => (
              <button
                key={industry}
                onClick={() => {
                  if (search === industry) {
                    setSearch("");
                  } else {
                    setSearch(industry);
                  }
                }}
                className={`rounded-full border px-2.5 py-1 text-[10px] transition-colors ${search === industry ? "border-blue-300 bg-blue-50 text-blue-700" : "border-zinc-200 text-zinc-500 hover:bg-zinc-50"}`}
              >
                {industry} ({count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search + Filters */}
      <div className="space-y-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, location, or industry..."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
        />

        <div className="flex flex-wrap gap-2">
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
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-zinc-400">
        Showing {filtered.length} of {leads.length} leads
        {hasFilters && filtered.length > 0 && (
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

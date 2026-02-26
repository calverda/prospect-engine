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
type ViewMode = "table" | "cards";
type SortCol = "business" | "location" | "score" | "priority" | "site";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;

const SCORE_ORDER: Record<string, number> = { "Hot Lead": 0, "Warm Lead": 1, "Cool Lead": 2, "Skip": 3 };
const PRIORITY_ORDER: Record<string, number> = { "High": 0, "Medium": 1, "Low": 2 };
const SITE_ORDER: Record<string, number> = { "No Website": 0, "Needs Overhaul": 1, "Needs Update": 2, "Acceptable": 3, "Well Maintained": 4 };

export function LeadFilters({ leads }: LeadFiltersProps) {
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [siteFilter, setSiteFilter] = useState<SiteFilter>("all");
  const [hideRedFlags, setHideRedFlags] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sortCol, setSortCol] = useState<SortCol>("score");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;

    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case "business":
          cmp = a.businessName.localeCompare(b.businessName);
          break;
        case "location":
          cmp = a.location.localeCompare(b.location);
          break;
        case "score":
          cmp = (SCORE_ORDER[a.leadScore ?? ""] ?? 99) - (SCORE_ORDER[b.leadScore ?? ""] ?? 99);
          break;
        case "priority":
          cmp = (PRIORITY_ORDER[a.salesPriority ?? ""] ?? 99) - (PRIORITY_ORDER[b.salesPriority ?? ""] ?? 99);
          break;
        case "site":
          cmp = (SITE_ORDER[a.siteQuality ?? ""] ?? 99) - (SITE_ORDER[b.siteQuality ?? ""] ?? 99);
          break;
      }
      return cmp * dir;
    });

    return arr;
  }, [filtered, sortCol, sortDir]);

  // Reset to page 1 when filters change
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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

  // Industry breakdown
  const industries = useMemo(() => {
    const map: Record<string, number> = {};
    for (const l of leads) {
      map[l.industry] = (map[l.industry] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  function handleFilterChange<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
    setPage(1);
  }

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <span className="ml-0.5 text-zinc-300">↕</span>;
    return <span className="ml-0.5">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const scoreColor = (score: string | null) => {
    if (score === "Hot Lead") return "text-red-600";
    if (score === "Warm Lead") return "text-orange-600";
    if (score === "Cool Lead") return "text-blue-600";
    return "text-zinc-400";
  };

  const priorityColor = (p: string | null) => {
    if (p === "High") return "text-green-700 font-medium";
    if (p === "Medium") return "text-yellow-600";
    return "text-zinc-400";
  };

  const siteColor = (s: string | null) => {
    if (s === "No Website" || s === "Needs Overhaul") return "text-red-500";
    if (s === "Needs Update") return "text-orange-500";
    if (s === "Acceptable") return "text-zinc-500";
    if (s === "Well Maintained") return "text-green-600";
    return "text-zinc-400";
  };

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="rounded-lg border bg-white p-4 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-700">Lead Overview</h3>

        {/* Score breakdown — clickable */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleFilterChange(setScoreFilter, scoreFilter === "Hot Lead" ? "all" : "Hot Lead")}
            className={`rounded-lg border p-3 text-center transition-colors ${scoreFilter === "Hot Lead" ? "border-red-300 bg-red-50" : "hover:bg-zinc-50"}`}
          >
            <p className="text-2xl font-bold text-red-600">{counts.score["Hot Lead"] ?? 0}</p>
            <p className="text-[10px] font-medium text-red-600">Hot Leads</p>
          </button>
          <button
            onClick={() => handleFilterChange(setScoreFilter, scoreFilter === "Warm Lead" ? "all" : "Warm Lead")}
            className={`rounded-lg border p-3 text-center transition-colors ${scoreFilter === "Warm Lead" ? "border-orange-300 bg-orange-50" : "hover:bg-zinc-50"}`}
          >
            <p className="text-2xl font-bold text-orange-600">{counts.score["Warm Lead"] ?? 0}</p>
            <p className="text-[10px] font-medium text-orange-600">Warm Leads</p>
          </button>
          <button
            onClick={() => handleFilterChange(setScoreFilter, scoreFilter === "Cool Lead" ? "all" : "Cool Lead")}
            className={`rounded-lg border p-3 text-center transition-colors ${scoreFilter === "Cool Lead" ? "border-blue-300 bg-blue-50" : "hover:bg-zinc-50"}`}
          >
            <p className="text-2xl font-bold text-blue-600">{counts.score["Cool Lead"] ?? 0}</p>
            <p className="text-[10px] font-medium text-blue-600">Cool Leads</p>
          </button>
          <button
            onClick={() => handleFilterChange(setScoreFilter, scoreFilter === "Skip" ? "all" : "Skip")}
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
            onClick={() => handleFilterChange(setSiteFilter, siteFilter === "No Website" ? "all" : "No Website")}
            className={`text-center rounded transition-colors ${siteFilter === "No Website" ? "bg-red-50" : "hover:bg-zinc-50"}`}
          >
            <p className="text-lg font-bold text-red-600">{counts.site["No Website"] ?? 0}</p>
            <p className="text-[10px] text-zinc-500">No Website</p>
          </button>
          <button
            onClick={() => handleFilterChange(setSiteFilter, siteFilter === "Needs Overhaul" ? "all" : "Needs Overhaul")}
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
                    handleFilterChange(setSearch, "");
                  } else {
                    handleFilterChange(setSearch, industry);
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
          onChange={(e) => handleFilterChange(setSearch, e.target.value)}
          placeholder="Search by name, location, or industry..."
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
        />

        <div className="flex flex-wrap gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => handleFilterChange(setPriorityFilter, e.target.value as PriorityFilter)}
            className={`rounded-full border px-3 py-1 text-xs ${priorityFilter !== "all" ? "border-green-300 bg-green-50 text-green-700" : "border-zinc-300 bg-white text-zinc-600"}`}
          >
            <option value="all">All Priorities</option>
            <option value="High">High ({counts.priority["High"] ?? 0})</option>
            <option value="Medium">Medium ({counts.priority["Medium"] ?? 0})</option>
            <option value="Low">Low ({counts.priority["Low"] ?? 0})</option>
          </select>

          <select
            value={siteFilter}
            onChange={(e) => handleFilterChange(setSiteFilter, e.target.value as SiteFilter)}
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
              onClick={() => handleFilterChange(setHideRedFlags, !hideRedFlags)}
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
                setPage(1);
              }}
              className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Results count + view toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400">
          Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, sorted.length)} of {sorted.length} leads
          {hasFilters && <> (filtered from {leads.length})</>}
          {hasFilters && sorted.length > 0 && (
            <> &middot; {filtered.filter((l) => l.contactEmail).length} with email</>
          )}
        </p>
        <div className="flex rounded-md border border-zinc-200 overflow-hidden">
          <button
            onClick={() => setViewMode("table")}
            className={`px-2.5 py-1 text-xs ${viewMode === "table" ? "bg-zinc-900 text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"}`}
            title="Table view"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M.99 5.24A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25l.01 9.5A2.25 2.25 0 0116.76 17H3.26A2.25 2.25 0 011 14.75l-.01-9.5zm8.26 9.52v-3.5H5.26v3.5h4zm1.5 0h4v-3.5h-4v3.5zm4-5v-3.5h-4v3.5h4zm-5.5-3.5v3.5H5.26v-3.5h4z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`px-2.5 py-1 text-xs border-l border-zinc-200 ${viewMode === "cards" ? "bg-zinc-900 text-white" : "bg-white text-zinc-500 hover:bg-zinc-50"}`}
            title="Card view"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M2 4.5A2.5 2.5 0 014.5 2h11A2.5 2.5 0 0118 4.5v11a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 012 15.5v-11zM4.5 4a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h11a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5h-11z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Lead list */}
      {paged.length > 0 ? (
        viewMode === "table" ? (
          <div className="rounded-lg border bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-zinc-50 text-left text-xs font-medium text-zinc-500">
                    <th className="px-3 py-2"><button type="button" onClick={() => handleSort("business")} className="hover:text-zinc-900">Business<SortIcon col="business" /></button></th>
                    <th className="px-3 py-2"><button type="button" onClick={() => handleSort("location")} className="hover:text-zinc-900">Location<SortIcon col="location" /></button></th>
                    <th className="px-3 py-2"><button type="button" onClick={() => handleSort("score")} className="hover:text-zinc-900">Score<SortIcon col="score" /></button></th>
                    <th className="px-3 py-2"><button type="button" onClick={() => handleSort("priority")} className="hover:text-zinc-900">Priority<SortIcon col="priority" /></button></th>
                    <th className="px-3 py-2"><button type="button" onClick={() => handleSort("site")} className="hover:text-zinc-900">Site<SortIcon col="site" /></button></th>
                    <th className="px-3 py-2">Contact</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((lead) => (
                    <tr key={lead.id} className="border-b last:border-0 hover:bg-zinc-50 transition-colors">
                      <td className="px-3 py-2.5">
                        <a href={`/prospect/${lead.slug}`} className="font-medium text-zinc-900 hover:text-blue-600 hover:underline">
                          {lead.businessName}
                        </a>
                        {lead.redFlags && (
                          <span className="ml-1.5 inline-block rounded bg-red-100 px-1 py-0.5 text-[9px] font-medium text-red-600" title={lead.redFlags}>
                            Flag
                          </span>
                        )}
                        {lead.opportunityNotes && (
                          <p className="text-[11px] text-zinc-400 truncate max-w-[250px]" title={lead.opportunityNotes}>
                            {lead.opportunityNotes}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-zinc-500 whitespace-nowrap">{lead.location}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs font-medium ${scoreColor(lead.leadScore)}`}>
                          {lead.leadScore ? lead.leadScore.replace(" Lead", "") : "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs ${priorityColor(lead.salesPriority)}`}>
                          {lead.salesPriority ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs ${siteColor(lead.siteQuality)}`}>
                          {lead.siteQuality ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {lead.contactEmail && (
                            <a href={`mailto:${lead.contactEmail}`} className="text-zinc-300 hover:text-blue-500" title={lead.contactEmail}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                                <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                              </svg>
                            </a>
                          )}
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="text-zinc-300 hover:text-green-500" title={lead.phone}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                              </svg>
                            </a>
                          )}
                          {!lead.contactEmail && !lead.phone && <span className="text-[10px] text-zinc-300">—</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <a href={`/prospect/${lead.slug}`} className="text-[11px] text-blue-600 hover:underline whitespace-nowrap">
                          View →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            {paged.map((lead) => (
              <LeadCard key={lead.id} prospect={lead} />
            ))}
          </div>
        )
      ) : (
        <p className="text-sm text-zinc-400 py-4 text-center">
          No leads match your filters.
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => setPage(1)}
            disabled={safePage === 1}
            className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-30"
          >
            First
          </button>
          <button
            onClick={() => setPage(safePage - 1)}
            disabled={safePage === 1}
            className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-30"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
            .reduce<(number | "...")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-1 text-xs text-zinc-300">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`rounded border px-2.5 py-1 text-xs ${
                    safePage === p
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}

          <button
            onClick={() => setPage(safePage + 1)}
            disabled={safePage === totalPages}
            className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-30"
          >
            Next
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={safePage === totalPages}
            className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50 disabled:opacity-30"
          >
            Last
          </button>
        </div>
      )}
    </div>
  );
}

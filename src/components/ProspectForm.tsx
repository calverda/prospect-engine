"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { IndustryKey } from "@/lib/pipeline/types";

const INDUSTRY_OPTIONS: { value: IndustryKey; label: string }[] = [
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrician", label: "Electrical" },
  { value: "landscaping", label: "Landscaping" },
  { value: "dental", label: "Dental" },
  { value: "behavioral_health", label: "Behavioral Health" },
  { value: "pest_control", label: "Pest Control" },
  { value: "general_contractor", label: "General Contractor" },
  { value: "church", label: "Church / House of Worship" },
  { value: "school", label: "School / Education" },
  { value: "local_government", label: "Local Government" },
];

export function ProspectForm() {
  const [businessName, setBusinessName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [location, setLocation] = useState("Long Island, NY");
  const [industry, setIndustry] = useState<IndustryKey>("hvac");
  const [loading, setLoading] = useState<"generate" | "save" | null>(null);
  const router = useRouter();

  async function handleAction(generateNow: boolean) {
    setLoading(generateNow ? "generate" : "save");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, websiteUrl, location, industry, generateNow }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();

      if (generateNow) {
        window.location.href = `/prospect/${data.slug}`;
      } else {
        setBusinessName("");
        setWebsiteUrl("");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      alert("Failed. Check console for details.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleAction(true);
      }}
      className="rounded-lg border bg-white p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Business Name
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Joe's Plumbing"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Website URL</label>
          <input
            type="text"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="joesplumbing.com"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Huntington, Long Island"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Industry</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value as IndustryKey)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => handleAction(false)}
          disabled={loading !== null || !businessName}
          className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          {loading === "save" ? "Saving..." : "Save as Lead"}
        </button>
        <button
          type="submit"
          disabled={loading !== null || !businessName}
          className="flex-1 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading === "generate" ? "Generating..." : "Generate Package"}
        </button>
      </div>
    </form>
  );
}

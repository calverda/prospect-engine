"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Prospect } from "@/lib/db/schema";
import { PipelineStatus } from "./PipelineStatus";
import { formatDate } from "@/lib/utils/format";

interface ProspectCardProps {
  prospect: Prospect;
}

export function ProspectCard({ prospect }: ProspectCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const isComplete = prospect.status === "complete";
  const isActive = ["scraping", "analyzing", "building", "deploying"].includes(
    prospect.status
  );

  async function handleDelete() {
    if (!confirm(`Delete "${prospect.businessName}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/prospects/${prospect.id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      alert("Failed to delete");
      setDeleting(false);
    }
  }

  return (
    <div className={`rounded-lg border bg-white p-4 ${deleting ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{prospect.businessName}</h3>
          <p className="text-sm text-zinc-500">
            {prospect.industry} &middot; {prospect.location}
          </p>
          {isActive && prospect.statusMessage && (
            <p className="mt-0.5 text-xs text-zinc-400">
              {prospect.statusMessage}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <PipelineStatus status={prospect.status} />
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded p-1 text-zinc-300 hover:bg-red-50 hover:text-red-500"
            title="Delete prospect"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {prospect.leadScore && (
        <div className="mt-2 flex gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            prospect.leadScore === "Hot Lead" ? "bg-red-100 text-red-700" :
            prospect.leadScore === "Warm Lead" ? "bg-orange-100 text-orange-700" :
            prospect.leadScore === "Cool Lead" ? "bg-blue-100 text-blue-700" :
            "bg-zinc-100 text-zinc-600"
          }`}>
            {prospect.leadScore}
          </span>
          {prospect.salesPriority && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              prospect.salesPriority === "High" ? "bg-green-100 text-green-700" :
              prospect.salesPriority === "Medium" ? "bg-yellow-100 text-yellow-700" :
              "bg-zinc-100 text-zinc-600"
            }`}>
              {prospect.salesPriority} Priority
            </span>
          )}
        </div>
      )}

      <div className="mt-3 flex gap-3 text-sm">
        <Link
          href={`/prospect/${prospect.slug}`}
          className="text-blue-600 hover:underline"
        >
          View Package
        </Link>
        {prospect.previewUrl && (
          <a
            href={prospect.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Preview Site
          </a>
        )}
        {isComplete && (
          <Link
            href={`/report/${prospect.slug}`}
            className="text-blue-600 hover:underline"
          >
            Intel Report
          </Link>
        )}
      </div>

      <p className="mt-2 text-xs text-zinc-400">
        {formatDate(prospect.createdAt)}
      </p>
    </div>
  );
}

import Link from "next/link";
import type { Prospect } from "@/lib/db/schema";
import { PipelineStatus } from "./PipelineStatus";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface ProspectCardProps {
  prospect: Prospect;
}

export function ProspectCard({ prospect }: ProspectCardProps) {
  const isComplete = prospect.status === "complete";

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{prospect.businessName}</h3>
          <p className="text-sm text-zinc-500">
            {prospect.industry} &middot; {prospect.location}
          </p>
        </div>
        <PipelineStatus status={prospect.status} />
      </div>

      {isComplete && prospect.revenueGapMonthly && (
        <p className="mt-2 text-sm">
          Revenue gap:{" "}
          <span className="font-semibold text-red-600">
            {formatCurrency(prospect.revenueGapMonthly)}/mo
          </span>
        </p>
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

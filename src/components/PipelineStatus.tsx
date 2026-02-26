import type { PipelineStatus as Status } from "@/lib/pipeline/types";

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string }
> = {
  saved: { label: "Lead", color: "bg-slate-100 text-slate-500" },
  pending: { label: "Pending", color: "bg-zinc-100 text-zinc-600" },
  scraping: { label: "Scraping", color: "bg-blue-100 text-blue-700" },
  analyzing: { label: "Analyzing", color: "bg-purple-100 text-purple-700" },
  building: { label: "Building", color: "bg-amber-100 text-amber-700" },
  deploying: { label: "Deploying", color: "bg-cyan-100 text-cyan-700" },
  complete: { label: "Complete", color: "bg-green-100 text-green-700" },
  error: { label: "Error", color: "bg-red-100 text-red-700" },
};

interface PipelineStatusProps {
  status: string;
}

export function PipelineStatus({ status }: PipelineStatusProps) {
  const config = STATUS_CONFIG[status as Status] ?? STATUS_CONFIG.pending;
  const isActive = ["scraping", "analyzing", "building", "deploying"].includes(
    status
  );

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      {isActive && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {config.label}
    </span>
  );
}

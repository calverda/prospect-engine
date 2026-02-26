import { db } from "@/lib/db";
import { prospects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PipelineStatus } from "@/components/PipelineStatus";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default async function ProspectDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await db
    .select()
    .from(prospects)
    .where(eq(prospects.slug, slug))
    .limit(1);

  if (result.length === 0) notFound();

  const prospect = result[0];

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white px-6 py-4">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold">{prospect.businessName}</h1>
          <PipelineStatus status={prospect.status} />
        </div>
        <p className="text-sm text-zinc-500">
          {prospect.industry} &middot; {prospect.location} &middot;{" "}
          {formatDate(prospect.createdAt)}
        </p>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        {/* Quick Stats */}
        {prospect.status === "complete" && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm text-zinc-500">Monthly Revenue Gap</p>
              <p className="text-2xl font-bold text-red-600">
                {prospect.revenueGapMonthly
                  ? formatCurrency(prospect.revenueGapMonthly)
                  : "N/A"}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm text-zinc-500">Annual Revenue Gap</p>
              <p className="text-2xl font-bold text-red-600">
                {prospect.revenueGapAnnual
                  ? formatCurrency(prospect.revenueGapAnnual)
                  : "N/A"}
              </p>
            </div>
            <div className="rounded-lg border bg-white p-4">
              <p className="text-sm text-zinc-500">Report Views</p>
              <p className="text-2xl font-bold">
                {prospect.reportViewCount ?? 0}
              </p>
            </div>
          </div>
        )}

        {/* Links */}
        <div className="flex gap-4">
          {prospect.previewUrl && (
            <a
              href={prospect.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
            >
              View Preview Site
            </a>
          )}
          {prospect.repoUrl && (
            <a
              href={prospect.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-50"
            >
              GitHub Repo
            </a>
          )}
          <Link
            href={`/report/${prospect.slug}`}
            className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-50"
          >
            Intel Report
          </Link>
        </div>

        {/* Error Message */}
        {prospect.status === "error" && prospect.errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{prospect.errorMessage}</p>
          </div>
        )}

        {/* Raw Data (collapsible) */}
        {prospect.businessAnalysis && (
          <details className="rounded-lg border bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
              Business Analysis (JSON)
            </summary>
            <pre className="overflow-auto border-t px-4 py-3 text-xs">
              {JSON.stringify(
                JSON.parse(prospect.businessAnalysis),
                null,
                2
              )}
            </pre>
          </details>
        )}

        {prospect.competitiveIntel && (
          <details className="rounded-lg border bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
              Competitive Intel (JSON)
            </summary>
            <pre className="overflow-auto border-t px-4 py-3 text-xs">
              {JSON.stringify(
                JSON.parse(prospect.competitiveIntel),
                null,
                2
              )}
            </pre>
          </details>
        )}
      </main>
    </div>
  );
}

import type { ReportData } from "@/lib/pipeline/report-generator";
import { formatCurrency } from "@/lib/utils/format";

interface IntelReportProps {
  data: ReportData;
}

export function IntelReport({ data }: IntelReportProps) {
  const { intel, competitors, prospect } = data;

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      {/* Header */}
      <header className="border-b pb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          {data.industry} Market Intelligence
        </p>
        <h1 className="mt-1 text-2xl font-bold">{data.location}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Prepared for {data.businessName} &middot; {data.date}
        </p>
      </header>

      {/* Market Snapshot */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Market Snapshot</h2>
        <p className="text-sm leading-relaxed text-zinc-700">
          {intel.marketSnapshot}
        </p>
      </section>

      {/* Competitor Table */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Who Dominates Your Market
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 font-medium">#</th>
              <th className="pb-2 font-medium">Business</th>
              <th className="pb-2 font-medium">Rating</th>
              <th className="pb-2 font-medium">Reviews</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((c, i) => (
              <tr key={c.name} className="border-b">
                <td className="py-2">{i + 1}</td>
                <td className="py-2">{c.name}</td>
                <td className="py-2">{c.rating}</td>
                <td className="py-2">{c.reviewCount}</td>
              </tr>
            ))}
            <tr className="border-b bg-amber-50 font-medium">
              <td className="py-2">&raquo;</td>
              <td className="py-2">YOU</td>
              <td className="py-2">{prospect.rating}</td>
              <td className="py-2">{prospect.reviewCount}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Key Findings */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Key Findings</h2>
        <ul className="space-y-2">
          {intel.keyFindings.map((finding, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="text-zinc-400">&rarr;</span>
              <span>{finding}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Revenue Opportunity */}
      <section className="rounded-lg bg-zinc-50 p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold">Revenue Opportunity</h2>
        <p className="text-3xl font-bold">
          {formatCurrency(intel.revenueOpportunity.monthlyLow)} &ndash;{" "}
          {formatCurrency(intel.revenueOpportunity.monthlyHigh)}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          estimated monthly revenue gap
        </p>
        <p className="mt-3 text-xs text-zinc-400">
          {intel.revenueOpportunity.methodology}
        </p>
      </section>

      {/* Recommendations */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">What We&apos;d Recommend</h2>
        <ol className="list-inside list-decimal space-y-2 text-sm">
          {intel.topRecommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ol>
      </section>

      {/* Footer */}
      <footer className="border-t pt-6 text-center text-sm text-zinc-500">
        <p>&mdash; Calverda</p>
      </footer>
    </div>
  );
}

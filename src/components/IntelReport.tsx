import type { ReportData } from "@/lib/pipeline/report-generator";
import { formatCurrency } from "@/lib/utils/format";

interface IntelReportProps {
  data: ReportData;
}

export function IntelReport({ data }: IntelReportProps) {
  const { intel, competitors, prospect, audit, traffic } = data;

  // Find the top competitor for comparison
  const topCompetitor = competitors[0];
  const reviewGap = topCompetitor
    ? topCompetitor.reviewCount - prospect.reviewCount
    : 0;

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Hero Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] px-6 py-16 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-500 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-indigo-500 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wider uppercase text-blue-300 backdrop-blur-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            {data.industry} Market Intelligence
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Competitive Analysis
          </h1>
          <p className="mt-2 text-xl text-slate-300">
            {data.location}
          </p>
          <div className="mt-6 flex items-center gap-3 text-sm text-slate-400">
            <span>Prepared for <strong className="text-white">{data.businessName}</strong></span>
            <span className="text-slate-600">/</span>
            <span>{data.date}</span>
          </div>
        </div>
      </header>

      {/* Revenue Opportunity — the money shot, first */}
      <section className="relative -mt-1 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-emerald-100">
            Estimated Revenue You&apos;re Leaving on the Table
          </p>
          <p className="mt-4 text-5xl font-extrabold tracking-tight sm:text-6xl">
            {formatCurrency(intel.revenueOpportunity.monthlyLow)}&ndash;{formatCurrency(intel.revenueOpportunity.monthlyHigh)}
          </p>
          <p className="mt-2 text-lg text-emerald-100">per month</p>
          <div className="mt-4 inline-flex items-center gap-4 rounded-full bg-white/10 px-6 py-2 text-sm backdrop-blur-sm">
            <span>
              {formatCurrency(intel.revenueOpportunity.annualLow)}&ndash;{formatCurrency(intel.revenueOpportunity.annualHigh)} annually
            </span>
          </div>
          <p className="mx-auto mt-4 max-w-lg text-xs text-emerald-200/70">
            {intel.revenueOpportunity.methodology}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-10">

          {/* Market Snapshot */}
          <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200/60">
            <SectionLabel>Market Overview</SectionLabel>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Market Snapshot</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {intel.marketSnapshot}
            </p>
          </section>

          {/* Map Pack + Position — side by side */}
          {(intel.mapPackAnalysis || intel.prospectPosition) && (
            <div className="grid gap-6 md:grid-cols-2">
              {intel.mapPackAnalysis && (
                <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
                  <SectionLabel>Google Maps</SectionLabel>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">Map Pack Analysis</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {intel.mapPackAnalysis}
                  </p>
                </section>
              )}
              {intel.prospectPosition && (
                <section className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6">
                  <SectionLabel className="text-amber-600">Your Position</SectionLabel>
                  <h3 className="mt-1 text-lg font-bold text-amber-900">Where You Stand</h3>
                  <p className="mt-3 text-sm leading-relaxed text-amber-800">
                    {intel.prospectPosition}
                  </p>
                </section>
              )}
            </div>
          )}

          {/* Competitor Table */}
          <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200/60">
            <SectionLabel>Competitive Landscape</SectionLabel>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Who Dominates Your Market
            </h2>
            {reviewGap > 0 && (
              <p className="mt-2 text-sm text-slate-500">
                The #1 competitor has <strong className="text-red-600">{reviewGap} more reviews</strong> than you.
              </p>
            )}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Rank</th>
                    <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Business</th>
                    <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Rating</th>
                    <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Reviews</th>
                    <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Schema</th>
                    <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Blog</th>
                  </tr>
                </thead>
                <tbody>
                  {competitors.map((c, i) => (
                    <tr key={c.name} className="border-b border-slate-100">
                      <td className="py-3 pr-4">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                          {c.mapPackPosition || i + 1}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-slate-900">
                          {c.website ? (
                            <a
                              href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-600 hover:underline"
                            >
                              {c.name}
                            </a>
                          ) : (
                            c.name
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1">
                          <StarRating rating={c.rating} />
                          <span className="text-slate-600">{c.rating}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-900">{c.reviewCount}</td>
                      <td className="py-3 pr-4">
                        <StatusDot value={c.hasSchema} />
                      </td>
                      <td className="py-3">
                        <StatusDot value={c.hasBlog} />
                      </td>
                    </tr>
                  ))}
                  {/* Prospect Row */}
                  <tr className="bg-blue-50">
                    <td className="py-3 pr-4">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        ?
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-bold text-blue-900">
                      {data.businessName} <span className="text-xs font-normal text-blue-500">(You)</span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1">
                        <StarRating rating={prospect.rating} />
                        <span className="font-medium text-blue-900">{prospect.rating}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-bold text-blue-900">{prospect.reviewCount}</td>
                    <td className="py-3 pr-4" colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Digital Health Scorecard */}
          {(audit || traffic || prospect.gbpCompleteness !== null) && (
            <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200/60">
              <SectionLabel>Website &amp; Digital Presence</SectionLabel>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Your Digital Health</h2>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {audit && (
                  <>
                    <ScoreGauge label="Performance" value={audit.scores.performance} />
                    <ScoreGauge label="SEO Score" value={audit.scores.seo} />
                    <ScoreGauge label="Accessibility" value={audit.scores.accessibility} />
                  </>
                )}
                {prospect.gbpCompleteness !== null && (
                  <ScoreGauge label="GBP Completeness" value={prospect.gbpCompleteness} />
                )}
              </div>
              {(traffic || audit) && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {traffic && traffic.indexedPages > 0 && (
                    <MetricCard label="Google Indexed Pages" value={traffic.indexedPages.toLocaleString()} />
                  )}
                  {audit && (
                    <MetricCard
                      label="Mobile Ready"
                      value={audit.mobileReady ? "Yes" : "No"}
                      valueColor={audit.mobileReady ? "text-green-600" : "text-red-600"}
                    />
                  )}
                </div>
              )}
              {audit && audit.seoIssues.length > 0 && (
                <div className="mt-6 rounded-xl bg-red-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
                    SEO Issues Detected ({audit.seoIssues.length})
                  </p>
                  <ul className="mt-2 space-y-1">
                    {audit.seoIssues.map((issue) => (
                      <li key={issue.id} className="flex items-start gap-2 text-sm text-red-800">
                        <span className="mt-0.5 text-red-400">&times;</span>
                        {issue.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Key Findings */}
          <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200/60">
            <SectionLabel>Analysis</SectionLabel>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Key Findings</h2>
            <div className="mt-6 space-y-4">
              {intel.keyFindings.map((finding, i) => (
                <div key={i} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-slate-700 pt-0.5">{finding}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Recommendations */}
          <section className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Action Plan
            </p>
            <h2 className="mt-1 text-xl font-bold">What We&apos;d Recommend</h2>
            <div className="mt-6 space-y-4">
              {intel.topRecommendations.map((rec, i) => (
                <div key={i} className="flex gap-4 rounded-xl bg-white/5 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-slate-200 pt-1">{rec}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Urgency Note */}
          {intel.urgencyNote && (
            <section className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-center">
              <div className="mx-auto max-w-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
                  Time Sensitive
                </p>
                <p className="mt-2 text-base font-medium leading-relaxed text-red-900">
                  {intel.urgencyNote}
                </p>
              </div>
            </section>
          )}

          {/* CTA */}
          {data.contact && (
            <section className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-center text-white shadow-lg">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Ready to Close the Gap?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-blue-100">
                Let&apos;s discuss how to turn these insights into revenue. No obligation — just a conversation about your growth.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href={`tel:${data.contact.phone}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-blue-700 shadow-md transition hover:bg-blue-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {data.contact.phone}
                </a>
                <a
                  href={`mailto:${data.contact.email}`}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {data.contact.email}
                </a>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0f172a] px-6 py-10 text-center">
        <p className="text-sm text-slate-500">
          This report was generated by
        </p>
        <p className="mt-1 text-lg font-bold text-white tracking-tight">
          Calverda
        </p>
        <p className="mt-3 text-xs text-slate-600">
          Data sourced from Google Business Profile, Google Maps, PageSpeed Insights, and proprietary analysis.
        </p>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-wider ${className ?? "text-slate-400"}`}>
      {children}
    </p>
  );
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  return (
    <span className="flex gap-px text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`h-3.5 w-3.5 ${i < full ? "fill-current" : i === full && hasHalf ? "fill-current opacity-50" : "fill-current opacity-15"}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function StatusDot({ value }: { value: boolean | null }) {
  if (value === null) return <span className="text-slate-300">&mdash;</span>;
  return value ? (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs text-green-600">&#10003;</span>
  ) : (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs text-red-500">&times;</span>
  );
}

function ScoreGauge({ label, value }: { label: string; value: number }) {
  const pct = Math.min(value, 100);
  const color =
    pct >= 80 ? "text-green-600" :
    pct >= 50 ? "text-amber-600" :
    "text-red-600";
  const ring =
    pct >= 80 ? "stroke-green-500" :
    pct >= 50 ? "stroke-amber-500" :
    "stroke-red-500";

  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2 p-2">
      <div className="relative h-20 w-20">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" className="stroke-slate-100" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            className={ring}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${color}`}>{value}</span>
        </div>
      </div>
      <p className="text-center text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 text-center">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold ${valueColor ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}

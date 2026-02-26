import type { ReportData } from "@/lib/pipeline/report-generator";

interface IntelReportProps {
  data: ReportData;
}

export function IntelReport({ data }: IntelReportProps) {
  const { intel, competitors, prospect, audit, traffic } = data;

  const topCompetitor = competitors[0];
  const reviewGap = topCompetitor
    ? topCompetitor.reviewCount - prospect.reviewCount
    : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <header className="bg-[#0f172a] px-8 pb-10 pt-8 text-white print:px-0 print:pt-6 print:pb-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold tracking-widest uppercase text-slate-400">
              Calverda
            </p>
            <p className="text-xs text-slate-500">{data.date}</p>
          </div>
          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
              {data.industry} &middot; {data.location}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Competitive Analysis
            </h1>
            <p className="mt-1 text-lg text-slate-300">
              Prepared for {data.businessName}
            </p>
          </div>
        </div>
      </header>

      {/* ── Executive Summary ── */}
      <section className="border-b bg-slate-50 px-8 py-8 print:break-after-avoid">
        <div className="mx-auto max-w-3xl">
          <SectionLabel>Executive Summary</SectionLabel>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            {intel.marketSnapshot}
          </p>
          {intel.prospectPosition && (
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              {intel.prospectPosition}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-8 py-10 space-y-10 print:px-0">

        {/* ── Digital Health Scorecard ── */}
        {(audit || traffic || prospect.gbpCompleteness !== null) && (
          <section className="print:break-inside-avoid">
            <SectionLabel>Your Online Presence</SectionLabel>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Digital Health Scorecard</h2>
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
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {traffic && traffic.indexedPages > 0 && (
                  <MetricCard label="Indexed Pages" value={traffic.indexedPages.toLocaleString()} />
                )}
                {audit && (
                  <MetricCard
                    label="Mobile Ready"
                    value={audit.mobileReady ? "Yes" : "No"}
                    valueColor={audit.mobileReady ? "text-green-600" : "text-red-600"}
                  />
                )}
                {audit && (
                  <MetricCard
                    label="HTTPS"
                    value={audit.hasHTTPS ? "Secure" : "Not Secure"}
                    valueColor={audit.hasHTTPS ? "text-green-600" : "text-red-600"}
                  />
                )}
              </div>
            )}
            {audit && audit.seoIssues.length > 0 && (
              <div className="mt-4 rounded-lg bg-red-50 p-4">
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

        {/* ── Competitor Table ── */}
        <section className="print:break-inside-avoid">
          <SectionLabel>Competitive Landscape</SectionLabel>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Who Dominates Your Market
          </h2>
          {intel.mapPackAnalysis && (
            <p className="mt-2 text-sm text-slate-500">{intel.mapPackAnalysis}</p>
          )}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-left">
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
                            className="hover:text-blue-600 hover:underline print:no-underline"
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
                    <td className="py-3 pr-4"><StatusDot value={c.hasSchema} /></td>
                    <td className="py-3"><StatusDot value={c.hasBlog} /></td>
                  </tr>
                ))}
                {/* Prospect Row */}
                <tr className="bg-blue-50 border-b-2 border-blue-200">
                  <td className="py-3 pr-4">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      &mdash;
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
          {reviewGap > 0 && (
            <p className="mt-3 text-xs text-slate-400">
              The #1 competitor has {reviewGap} more reviews than you.
            </p>
          )}
        </section>

        {/* ── Why They Outrank You — Competitive Gap Cards ── */}
        {intel.competitiveGaps && intel.competitiveGaps.length > 0 && (
          <section className="print:break-before-page">
            <SectionLabel>Gap Analysis</SectionLabel>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Why They Outrank You
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              These are the specific, verifiable differences between your online presence and your top competitors.
            </p>
            <div className="mt-6 space-y-4">
              {intel.competitiveGaps.map((gap, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white print:break-inside-avoid">
                  <div className="border-b border-slate-100 px-5 py-3">
                    <h3 className="text-sm font-bold text-slate-900">{gap.category}</h3>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    {/* Yours vs Theirs */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-md bg-red-50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400">You</p>
                        <p className="mt-1 text-sm font-medium text-red-800">{gap.yours}</p>
                      </div>
                      <div className="rounded-md bg-green-50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-green-500">Top Competitor</p>
                        <p className="mt-1 text-sm font-medium text-green-800">{gap.topCompetitor}</p>
                      </div>
                    </div>
                    {/* Impact */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Why This Matters</p>
                      <p className="mt-1 text-sm text-slate-600">{gap.impact}</p>
                    </div>
                    {/* Fix */}
                    <div className="rounded-md bg-blue-50 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">What To Do</p>
                      <p className="mt-1 text-sm text-blue-800">{gap.fix}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Key Findings ── */}
        <section className="print:break-inside-avoid">
          <SectionLabel>Analysis</SectionLabel>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Key Findings</h2>
          <div className="mt-4 space-y-3">
            {intel.keyFindings.map((finding, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-sm leading-relaxed text-slate-700 pt-0.5">{finding}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Recommendations with Calverda positioning ── */}
        <section className="rounded-xl bg-[#0f172a] p-8 text-white print:break-before-page print:break-inside-avoid">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Action Plan
          </p>
          <h2 className="mt-1 text-xl font-bold">Our Recommendations</h2>
          <div className="mt-6 space-y-5">
            {intel.topRecommendations.map((rec, i) => {
              // Handle both old (string) and new (object) formats
              const isLegacy = typeof rec === "string";
              const action = isLegacy ? rec : rec.action;
              const why = isLegacy ? null : rec.why;
              const calverda = isLegacy ? null : rec.howCalverdaHelps;

              return (
                <div key={i} className="rounded-lg bg-white/5 p-5">
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="pt-0.5 space-y-2">
                      <p className="text-sm font-semibold text-white">{action}</p>
                      {why && (
                        <p className="text-sm text-slate-300">{why}</p>
                      )}
                      {calverda && (
                        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                            How Calverda Helps
                          </p>
                          <p className="mt-1 text-sm text-emerald-100">{calverda}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Urgency Note ── */}
        {intel.urgencyNote && (
          <section className="rounded-lg border-2 border-amber-200 bg-amber-50 p-5 text-center print:break-inside-avoid">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Don&apos;t Wait
            </p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-amber-900">
              {intel.urgencyNote}
            </p>
          </section>
        )}

        {/* ── CTA ── */}
        {data.contact && (
          <section className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-center text-white print:break-inside-avoid">
            <h2 className="text-2xl font-bold tracking-tight">
              Ready to Close the Gap?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-blue-100">
              Let&apos;s discuss how to turn these insights into action. No obligation &mdash; just a straightforward conversation about your growth.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={`tel:${data.contact.phone}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-blue-700 shadow-md transition hover:bg-blue-50 print:shadow-none"
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

      {/* ── Footer ── */}
      <footer className="border-t bg-slate-50 px-8 py-8 print:bg-white">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-900 tracking-tight">Calverda</p>
            <p className="text-xs text-slate-400">
              Report generated {data.date}
            </p>
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Data Sources</p>
            <ul className="space-y-0.5 text-xs text-slate-500">
              <li>Rankings &amp; competitor data &mdash; Google Maps (via SerpAPI)</li>
              <li>Reviews &amp; business details &mdash; Google Places API</li>
              {audit && <li>Performance scores &mdash; Google PageSpeed Insights</li>}
            </ul>
          </div>
          <p className="mt-4 text-[10px] text-slate-400">
            All data reflects conditions at time of analysis. This report contains no estimated revenue figures &mdash; all metrics are directly observed from public sources.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
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
    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold ${valueColor ?? "text-slate-900"}`}>{value}</p>
    </div>
  );
}

import type { ScrapedData } from "@/lib/pipeline/types";
import type { IndustryConfig } from "@/lib/config/industries";

export function buildIntelPrompt(
  scraped: ScrapedData,
  industry: IndustryConfig,
  location: string
): string {
  const gbp = scraped.gbp;
  const audit = scraped.audit;
  const traffic = scraped.traffic;
  const competitors = scraped.competitors;

  let prompt = `Generate a competitive intelligence briefing for a ${industry.name} business in ${location}.\n\n`;

  // ── Prospect data ──
  prompt += `## THE PROSPECT\n`;
  prompt += `Name: ${gbp?.name ?? "Unknown"}\n`;
  prompt += `Rating: ${gbp?.rating ?? "N/A"} (${gbp?.reviewCount ?? 0} reviews)\n`;
  prompt += `GBP Completeness: ${gbp?.completenessScore ?? "N/A"}/100\n`;
  prompt += `Est. monthly traffic: ${traffic?.estimatedMonthlyTraffic ?? "Unknown"}\n`;
  prompt += `Indexed pages: ${traffic?.indexedPages ?? "Unknown"}\n`;

  if (audit) {
    prompt += `Website performance: ${audit.scores.performance}/100\n`;
    prompt += `SEO score: ${audit.scores.seo}/100\n`;
    prompt += `Accessibility: ${audit.scores.accessibility}/100\n`;
    prompt += `Mobile ready: ${audit.mobileReady ? "Yes" : "No"}\n`;
    prompt += `HTTPS: ${audit.hasHTTPS ? "Yes" : "No"}\n`;
    prompt += `Core Web Vitals: FCP ${audit.metrics.firstContentfulPaint}, LCP ${audit.metrics.largestContentfulPaint}, TBT ${audit.metrics.totalBlockingTime}, CLS ${audit.metrics.cumulativeLayoutShift}\n`;

    if (audit.seoIssues.length > 0) {
      prompt += `SEO issues found: ${audit.seoIssues.map((i) => i.title).join(", ")}\n`;
    }
  } else {
    prompt += `Website audit: Not available\n`;
  }
  prompt += "\n";

  // ── Competitor data ──
  if (competitors.length > 0) {
    prompt += `## TOP COMPETITORS IN THEIR MARKET\n`;
    prompt += competitors
      .map((c, i) => {
        let line = `${i + 1}. ${c.name} — ${c.rating}★ (${c.reviewCount} reviews) — Map Pack #${c.mapPackPosition}`;
        if (c.website) line += ` — ${c.website}`;
        if (c.homepageWordCount)
          line += ` — ${c.homepageWordCount} words on homepage`;
        if (c.hasSchema !== null)
          line += ` — Schema: ${c.hasSchema ? "Yes" : "No"}`;
        return line;
      })
      .join("\n");
    prompt += "\n\n";
  } else {
    prompt += `## COMPETITORS\nNo competitor data available.\n\n`;
  }

  // ── Industry benchmarks ──
  prompt += `## INDUSTRY BENCHMARKS (${industry.name})\n`;
  prompt += `Avg conversion rate (visitor → call): ${(industry.conversionRate * 100).toFixed(0)}%\n`;
  prompt += `Avg close rate (call → job): ${(industry.closeRate * 100).toFixed(0)}%\n`;
  prompt += `Avg service ticket: $${industry.avgTicket.service}\n`;
  prompt += `Avg install ticket: $${industry.avgTicket.install}\n\n`;

  // ── Revenue gap context ──
  prompt += `## REVENUE GAP CALCULATION CONTEXT\n`;
  prompt += `Use the review count differential as the primary signal:\n`;
  prompt += `- reviewGap = topCompetitorReviews - prospectReviews\n`;
  prompt += `- Each review represents ~10-20 actual customers (most never leave reviews)\n`;
  prompt += `- estimatedMissedCustomers = reviewGap × 1.5 (conservative multiplier)\n`;
  prompt += `- missedJobs = estimatedMissedCustomers × closeRate\n`;
  prompt += `- avgJobValue = (avgTicket.service × 3 + avgTicket.install) / 4\n`;
  prompt += `- monthlyRevenueGap = missedJobs × avgJobValue\n`;
  prompt += `- Apply 0.7 multiplier for the low estimate (conservative)\n`;
  prompt += `- In the methodology field, cite the specific review counts used.\n\n`;

  // ── Output format ──
  prompt += `---

Generate this JSON report. Use REAL numbers from the data above. Be specific, data-backed, and actionable.

{
  "marketSnapshot": "2-3 sentence overview of the competitive landscape in this specific market",
  "mapPackAnalysis": "who owns the top 3 spots and the primary reason why (reviews, age, content, etc.)",
  "prospectPosition": "where the prospect currently sits relative to competitors and what's holding them back",
  "keyFindings": [
    "3-5 specific, data-backed findings with real numbers — e.g. 'You have 12 reviews vs the #1 competitor's 247, a 20x gap'"
  ],
  "revenueOpportunity": {
    "monthlyLow": <number — conservative monthly estimate>,
    "monthlyHigh": <number — optimistic monthly estimate>,
    "annualLow": <number — monthlyLow × 12>,
    "annualHigh": <number — monthlyHigh × 12>,
    "methodology": "1-sentence explanation of how this was calculated using their specific numbers"
  },
  "topRecommendations": [
    "3 specific, actionable recommendations in priority order — each should reference their specific data"
  ],
  "urgencyNote": "1 sentence about why acting now matters — reference a specific competitive trend"
}

Return ONLY valid JSON. No markdown, no explanation.`;

  return prompt;
}

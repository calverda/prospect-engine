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

  let prompt = `Generate a competitive intelligence report for a ${industry.name} business in ${location}.\n\n`;

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
        if (c.serviceCount !== null)
          line += ` — ${c.serviceCount} service pages`;
        if (c.hasSchema !== null)
          line += ` — Schema: ${c.hasSchema ? "Yes" : "No"}`;
        if (c.hasBlog !== null)
          line += ` — Blog: ${c.hasBlog ? "Yes" : "No"}`;
        return line;
      })
      .join("\n");
    prompt += "\n\n";
  } else {
    prompt += `## COMPETITORS\nNo competitor data available.\n\n`;
  }

  // ── Output format ──
  prompt += `---

CRITICAL RULES:
- Do NOT estimate revenue, dollar amounts, or financial projections. These cannot be verified and undermine credibility.
- Focus ONLY on observable, verifiable competitive differences using the data provided above.
- Every claim must be backed by specific numbers from the scraped data.
- Be direct and specific about what competitors are doing better and exactly what needs to change.
- Position Calverda as a web design and digital marketing agency that specializes in local service businesses.

Generate this JSON report:

{
  "marketSnapshot": "2-3 sentence overview of the competitive landscape. Reference specific competitor names, review counts, and rankings from the data.",
  "mapPackAnalysis": "Who owns the top 3 map pack spots and the specific, observable reasons why — reference review counts, ratings, content volume, schema markup, etc.",
  "prospectPosition": "Where the prospect sits relative to competitors. Be specific about the gaps. Don't sugarcoat it.",
  "keyFindings": [
    "3-5 specific findings using real numbers from the data — e.g. 'You have 12 reviews vs the #1 competitor's 247'",
    "Each finding must reference actual scraped data, not estimates or projections"
  ],
  "competitiveGaps": [
    {
      "category": "Reviews & Reputation",
      "yours": "Exact data about the prospect (e.g. '12 reviews, 4.2★ rating')",
      "topCompetitor": "Exact data about the top competitor (e.g. '247 reviews, 4.8★ rating')",
      "impact": "Why this specific gap hurts their rankings — explain the Google ranking factor simply. For example: 'Google heavily weights review volume and recency when ranking local businesses in the map pack. A 20x review gap signals to Google that competitors are more established and trusted.'",
      "fix": "Specific, actionable step to close this gap (e.g. 'Implement a systematic review generation campaign — follow up with every completed job via text/email with a direct Google review link. Target 5-10 new reviews per month.')"
    }
  ],
  "topRecommendations": [
    {
      "action": "Specific action to take (e.g. 'Build a modern, SEO-optimized website')",
      "why": "Why this matters — cite specific data points (e.g. 'Your site scores 34/100 on performance while competitors average 78. Slow, outdated sites lose visitors before they ever call.')",
      "howCalverdaHelps": "How Calverda specifically addresses this — be concrete about what they deliver. For example: 'Calverda builds conversion-optimized websites with built-in local SEO, schema markup, and mobile-first performance — designed specifically for ${industry.name.toLowerCase()} businesses to rank in the map pack and turn visitors into calls.'"
    }
  ],
  "urgencyNote": "1 sentence about why acting now matters — reference a specific competitive trend from the data (e.g. 'Your top competitor gained X reviews in the last year while your profile has remained stagnant — the gap widens every month you wait.')"
}

Generate 4-6 competitive gaps. Only include categories where you have real, verifiable data to compare. Common categories:
- Reviews & Reputation (review count, rating)
- Website Content (word count, number of service pages, blog)
- Technical SEO (schema markup, performance score, mobile readiness, HTTPS)
- Google Business Profile (completeness, categories, hours, photos)
- Online Visibility (indexed pages, traffic estimates)
- Local Authority (map pack position, service area coverage)

Generate exactly 3 recommendations in priority order.
Return ONLY valid JSON. No markdown, no explanation.`;

  return prompt;
}

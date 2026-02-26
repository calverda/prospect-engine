import type {
  ProspectInput,
  ScrapedData,
  GBPData,
  ReviewData,
  WebsiteAudit,
  TrafficData,
  CompetitorProfile,
} from "./types";
import { crawlWebsite } from "@/lib/utils/crawler";

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";
const PAGESPEED_API_BASE =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const SERPAPI_BASE = "https://serpapi.com/search.json";

// ── Google Business Profile ──

/** Check if a Places API result name is a reasonable match for the business we searched for */
function isNameMatch(searchName: string, resultName: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const search = normalize(searchName);
  const result = normalize(resultName);

  // Exact match
  if (search === result) return true;

  // One contains the other (e.g. "Smith Plumbing" matches "Smith Plumbing & Heating LLC")
  if (result.includes(search) || search.includes(result)) return true;

  // Check word overlap — at least half the search words appear in the result
  const searchWords = search.split(" ").filter((w) => w.length > 2);
  const resultWords = new Set(result.split(" "));
  const matches = searchWords.filter((w) => resultWords.has(w)).length;
  if (searchWords.length > 0 && matches >= Math.ceil(searchWords.length / 2)) return true;

  return false;
}

export async function scrapeGBP(
  businessName: string,
  location: string
): Promise<GBPData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[scrapeGBP] GOOGLE_PLACES_API_KEY not set, skipping");
    return null;
  }

  // Step 1: Find place — try textsearch first (more forgiving), fall back to findplacefromtext
  const query = `${businessName} ${location}`;
  let placeId: string | null = null;

  // Try textsearch (broader matching)
  const textSearchUrl = new URL(`${PLACES_API_BASE}/textsearch/json`);
  textSearchUrl.searchParams.set("query", query);
  textSearchUrl.searchParams.set("key", apiKey);

  console.log(`[scrapeGBP] Searching for "${query}" via textsearch...`);
  const textRes = await fetch(textSearchUrl.toString());
  if (textRes.ok) {
    const textData = await textRes.json();
    if (textData.results && textData.results.length > 0) {
      // Validate the result actually matches our business name
      const bestMatch = textData.results.find(
        (r: { name: string }) => isNameMatch(businessName, r.name)
      );
      if (bestMatch) {
        placeId = bestMatch.place_id;
        console.log(`[scrapeGBP] Found via textsearch: ${bestMatch.name} (place_id: ${placeId})`);
      } else {
        console.log(`[scrapeGBP] textsearch returned results but none matched "${businessName}" — top result was "${textData.results[0].name}"`);
      }
    }
  }

  // Fallback to findplacefromtext
  if (!placeId) {
    console.log(`[scrapeGBP] textsearch missed, trying findplacefromtext...`);
    const findUrl = new URL(`${PLACES_API_BASE}/findplacefromtext/json`);
    findUrl.searchParams.set("input", query);
    findUrl.searchParams.set("inputtype", "textquery");
    findUrl.searchParams.set("fields", "place_id,name,formatted_address");
    findUrl.searchParams.set("key", apiKey);

    const findRes = await fetch(findUrl.toString());
    if (findRes.ok) {
      const findData = await findRes.json();
      if (findData.candidates && findData.candidates.length > 0) {
        const bestCandidate = findData.candidates.find(
          (c: { name: string }) => isNameMatch(businessName, c.name)
        );
        if (bestCandidate) {
          placeId = bestCandidate.place_id;
          console.log(`[scrapeGBP] Found via findplacefromtext: ${bestCandidate.name} (place_id: ${placeId})`);
        } else {
          console.log(`[scrapeGBP] findplacefromtext returned candidates but none matched "${businessName}" — top was "${findData.candidates[0].name}"`);
        }
      }
    }
  }

  if (!placeId) {
    console.warn(`[scrapeGBP] No matching place found for "${businessName}" in ${location}`);
    return null;
  }

  // Step 2: Get place details
  const detailFields = [
    "name",
    "formatted_address",
    "formatted_phone_number",
    "website",
    "rating",
    "user_ratings_total",
    "reviews",
    "photos",
    "opening_hours",
    "business_status",
    "types",
    "url",
  ].join(",");

  const detailUrl = new URL(`${PLACES_API_BASE}/details/json`);
  detailUrl.searchParams.set("place_id", placeId);
  detailUrl.searchParams.set("fields", detailFields);
  detailUrl.searchParams.set("key", apiKey);

  const detailRes = await fetch(detailUrl.toString());
  if (!detailRes.ok) {
    console.error(`[scrapeGBP] Place details failed: ${detailRes.status}`);
    return null;
  }

  const detailData = await detailRes.json();
  const place = detailData.result;

  if (!place) {
    console.warn(`[scrapeGBP] No details for place_id ${placeId}`);
    return null;
  }

  // Step 3: Extract structured data
  const reviews: ReviewData[] = (place.reviews ?? []).map(
    (r: {
      author_name: string;
      rating: number;
      text: string;
      relative_time_description: string;
    }) => ({
      author: r.author_name,
      rating: r.rating,
      text: r.text,
      time: r.relative_time_description,
    })
  );

  const hours: string[] =
    place.opening_hours?.weekday_text ?? [];

  const isOpen: boolean | null =
    place.opening_hours?.open_now ?? null;

  const photoCount = place.photos?.length ?? 0;

  const categories: string[] = place.types ?? [];

  // Step 4: Calculate completeness score (0-100)
  const completenessScore = calculateGBPCompleteness({
    name: place.name,
    address: place.formatted_address,
    phone: place.formatted_phone_number,
    website: place.website,
    hours,
    rating: place.rating,
    reviewCount: place.user_ratings_total ?? 0,
    photoCount,
    categories,
  });

  return {
    found: true,
    placeId,
    name: place.name,
    address: place.formatted_address ?? "",
    phone: place.formatted_phone_number ?? null,
    website: place.website ?? null,
    rating: place.rating ?? 0,
    reviewCount: place.user_ratings_total ?? 0,
    reviews,
    photoCount,
    hours,
    isOpen,
    categories,
    mapsUrl: place.url ?? `https://www.google.com/maps/place/?q=place_id:${placeId}`,
    completenessScore,
  };
}

function calculateGBPCompleteness(data: {
  name: string;
  address: string;
  phone: string | null;
  website: string | null;
  hours: string[];
  rating: number;
  reviewCount: number;
  photoCount: number;
  categories: string[];
}): number {
  let score = 0;

  if (data.name) score += 10;
  if (data.address) score += 10;
  if (data.phone) score += 10;
  if (data.website) score += 10;
  if (data.hours.length > 0) score += 10;
  if (data.rating > 0) score += 5;
  if (data.reviewCount >= 10) score += 10;
  if (data.reviewCount >= 50) score += 5;
  if (data.reviewCount >= 100) score += 5;
  if (data.photoCount >= 5) score += 10;
  if (data.photoCount >= 15) score += 5;
  if (data.categories.length > 1) score += 5;
  // description not available from API, give 5 as neutral
  score += 5;

  return Math.min(score, 100);
}

// ── Competitor Scanner ──

export async function scrapeCompetitors(
  industry: string,
  location: string,
  count = 5
): Promise<CompetitorProfile[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.warn("[scrapeCompetitors] SERPAPI_KEY not set, skipping");
    return [];
  }

  // Search Google Maps via SerpAPI
  const searchUrl = new URL(SERPAPI_BASE);
  searchUrl.searchParams.set("engine", "google_maps");
  searchUrl.searchParams.set("q", `${industry} ${location}`);
  searchUrl.searchParams.set("type", "search");
  searchUrl.searchParams.set("api_key", apiKey);

  const res = await fetch(searchUrl.toString());
  if (!res.ok) {
    console.error(`[scrapeCompetitors] SerpAPI failed: ${res.status}`);
    return [];
  }

  const data = await res.json();
  const localResults: SerpLocalResult[] = data.local_results ?? [];

  if (localResults.length === 0) {
    console.warn("[scrapeCompetitors] No local results found");
    return [];
  }

  // Map to CompetitorProfile — keep original map pack order (this IS the ranking)
  const competitors: CompetitorProfile[] = localResults
    .slice(0, count)
    .map((r, i) => ({
      name: r.title,
      rating: r.rating ?? 0,
      reviewCount: r.reviews ?? 0,
      website: r.website ?? null,
      address: r.address ?? "",
      mapPackPosition: i + 1,
      homepageWordCount: null,
      serviceCount: null,
      hasSchema: null,
      hasBlog: null,
    }));

  // Enrich all competitors with homepage crawl data (parallel, with timeout)
  const crawlPromises = competitors.map(async (comp) => {
    if (!comp.website) return;
    try {
      const siteData = await crawlHomepageLight(comp.website);
      comp.homepageWordCount = siteData.wordCount;
      comp.serviceCount = siteData.serviceCount;
      comp.hasSchema = siteData.hasSchema;
      comp.hasBlog = siteData.hasBlog;
    } catch (err) {
      console.warn(
        `[scrapeCompetitors] Failed to crawl ${comp.name}: ${err}`
      );
    }
  });
  await Promise.allSettled(crawlPromises);

  return competitors;
}

interface SerpLocalResult {
  title: string;
  rating?: number;
  reviews?: number;
  website?: string;
  address?: string;
  place_id?: string;
}

/** Light crawl of a competitor's homepage for basic intelligence */
async function crawlHomepageLight(url: string): Promise<{
  wordCount: number;
  serviceCount: number;
  hasSchema: boolean;
  hasBlog: boolean;
}> {
  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(normalizedUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CalverdaBot/1.0; +https://calverda.com)",
        Accept: "text/html",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const cheerio = await import("cheerio");
    const $ = cheerio.load(html);

    $("script, style, noscript").remove();

    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

    // Count service-like headings
    let serviceCount = 0;
    $("h2, h3").each((_, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (
        text.length > 3 &&
        text.length < 60 &&
        !/about|contact|blog|faq|review|testimonial/i.test(text)
      ) {
        serviceCount++;
      }
    });

    const hasSchema =
      $('script[type="application/ld+json"]').length > 0;

    const hasBlog =
      $('a[href*="blog"], a[href*="article"], a[href*="news"]').length > 0;

    return { wordCount, serviceCount, hasSchema, hasBlog };
  } finally {
    clearTimeout(timeout);
  }
}

// ── Website Audit (PageSpeed Insights) ──

export async function auditWebsite(
  url: string
): Promise<WebsiteAudit | null> {
  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;

  const apiUrl = new URL(PAGESPEED_API_BASE);
  apiUrl.searchParams.set("url", normalizedUrl);
  apiUrl.searchParams.set("strategy", "mobile");
  apiUrl.searchParams.append("category", "performance");
  apiUrl.searchParams.append("category", "seo");
  apiUrl.searchParams.append("category", "accessibility");

  // Optional: add API key for higher rate limits
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (apiKey) {
    apiUrl.searchParams.set("key", apiKey);
  }

  const res = await fetch(apiUrl.toString());
  if (!res.ok) {
    console.error(`[auditWebsite] PageSpeed API failed: ${res.status}`);
    return null;
  }

  const data = await res.json();

  const lighthouseResult = data.lighthouseResult;
  if (!lighthouseResult) {
    console.warn("[auditWebsite] No lighthouse result");
    return null;
  }

  const categories = lighthouseResult.categories ?? {};
  const audits = lighthouseResult.audits ?? {};

  // Extract scores (0-100)
  const scores = {
    performance: Math.round((categories.performance?.score ?? 0) * 100),
    seo: Math.round((categories.seo?.score ?? 0) * 100),
    accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
  };

  // Extract Core Web Vitals
  const metrics = {
    firstContentfulPaint:
      audits["first-contentful-paint"]?.displayValue ?? "N/A",
    largestContentfulPaint:
      audits["largest-contentful-paint"]?.displayValue ?? "N/A",
    totalBlockingTime:
      audits["total-blocking-time"]?.displayValue ?? "N/A",
    cumulativeLayoutShift:
      audits["cumulative-layout-shift"]?.displayValue ?? "N/A",
  };

  // Collect failing SEO audits
  const seoAuditRefs: { id: string }[] =
    categories.seo?.auditRefs ?? [];
  const seoIssues: { id: string; title: string }[] = [];

  for (const ref of seoAuditRefs) {
    const audit = audits[ref.id];
    if (audit && audit.score !== null && audit.score < 1) {
      seoIssues.push({
        id: ref.id,
        title: audit.title ?? ref.id,
      });
    }
  }

  // Mobile readiness: check viewport audit
  const mobileReady = audits["viewport"]?.score === 1;

  // HTTPS
  const hasHTTPS = normalizedUrl.startsWith("https://");

  return {
    found: true,
    url: normalizedUrl,
    scores,
    metrics,
    seoIssues,
    mobileReady,
    hasHTTPS,
  };
}

// ── Traffic Estimation ──

export async function estimateTraffic(
  domain: string
): Promise<TrafficData | null> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.warn("[estimateTraffic] SERPAPI_KEY not set, skipping");
    return null;
  }

  // Query SerpAPI for site: indexed page count
  const searchUrl = new URL(SERPAPI_BASE);
  searchUrl.searchParams.set("engine", "google");
  searchUrl.searchParams.set("q", `site:${domain}`);
  searchUrl.searchParams.set("api_key", apiKey);

  const res = await fetch(searchUrl.toString());
  if (!res.ok) {
    console.error(`[estimateTraffic] SerpAPI failed: ${res.status}`);
    return null;
  }

  const data = await res.json();

  // Extract total results count as proxy for indexed pages
  const totalResultsStr: string =
    data.search_information?.total_results?.toString() ?? "0";
  const indexedPages = parseInt(totalResultsStr.replace(/,/g, ""), 10) || 0;

  // Extract top keywords from organic results
  const organicResults: { title?: string; snippet?: string }[] =
    data.organic_results ?? [];
  const topKeywords = organicResults
    .slice(0, 10)
    .map((r) => r.title ?? "")
    .filter(Boolean);

  return {
    domain,
    indexedPages,
    estimatedMonthlyTraffic: 0, // not estimated — only verifiable data
    trafficValue: 0,
    topKeywords,
  };
}

// ── Master orchestrator ──

export async function collectAllData(
  input: ProspectInput
): Promise<ScrapedData> {
  console.log("[collectAllData] Starting parallel data collection...");

  const websiteUrl = input.websiteUrl
    ? normalizeUrl(input.websiteUrl)
    : undefined;

  const [crawledSite, gbp, competitors, audit, traffic] =
    await Promise.allSettled([
      websiteUrl ? crawlWebsite(websiteUrl) : Promise.resolve(null),
      scrapeGBP(input.businessName, input.location),
      scrapeCompetitors(input.industry, input.location),
      websiteUrl ? auditWebsite(websiteUrl) : Promise.resolve(null),
      websiteUrl
        ? estimateTraffic(extractDomain(websiteUrl))
        : Promise.resolve(null),
    ]);

  // Log results
  logResult("Website crawl", crawledSite);
  logResult("GBP", gbp);
  logResult("Competitors", competitors);
  logResult("Website audit", audit);
  logResult("Traffic estimate", traffic);

  return {
    crawledSite:
      crawledSite.status === "fulfilled" ? crawledSite.value : null,
    gbp: gbp.status === "fulfilled" ? gbp.value : null,
    competitors:
      competitors.status === "fulfilled" ? competitors.value : [],
    audit: audit.status === "fulfilled" ? audit.value : null,
    traffic: traffic.status === "fulfilled" ? traffic.value : null,
    collectedAt: new Date().toISOString(),
  };
}

// ── Helpers ──

function normalizeUrl(url: string): string {
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = "https://" + normalized;
  }
  return normalized;
}

function extractDomain(url: string): string {
  try {
    return new URL(normalizeUrl(url)).hostname;
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

function logResult(
  label: string,
  result: PromiseSettledResult<unknown>
): void {
  if (result.status === "fulfilled") {
    const val = result.value;
    if (val === null) {
      console.log(`  [${label}] skipped (no input)`);
    } else if (Array.isArray(val)) {
      console.log(`  [${label}] ${val.length} results`);
    } else {
      console.log(`  [${label}] done`);
    }
  } else {
    console.error(`  [${label}] FAILED: ${result.reason}`);
  }
}

import Anthropic from "@anthropic-ai/sdk";
import type {
  ProspectInput,
  ScrapedData,
  BusinessAnalysis,
  CompetitiveIntel,
} from "./types";
import { INDUSTRIES, type IndustryConfig } from "@/lib/config/industries";
import { buildAnalysisPrompt } from "@/lib/prompts/analysis";
import { buildIntelPrompt } from "@/lib/prompts/report";
import { buildBriefPrompt } from "@/lib/prompts/build-brief";
import { buildSitePlanPrompt } from "@/lib/prompts/site-plan";

const MODEL = "claude-sonnet-4-20250514";

// Sonnet 4 pricing per 1M tokens
const PRICE_INPUT_PER_M = 3;
const PRICE_OUTPUT_PER_M = 15;

// ── Token tracking ──

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cost: number; // in dollars
}

/** Accumulator for tracking token usage across multiple API calls */
const _usageAccumulator: TokenUsage = { inputTokens: 0, outputTokens: 0, cost: 0 };

export function getAccumulatedUsage(): TokenUsage {
  return { ..._usageAccumulator };
}

export function resetUsageAccumulator(): void {
  _usageAccumulator.inputTokens = 0;
  _usageAccumulator.outputTokens = 0;
  _usageAccumulator.cost = 0;
}

function trackUsage(inputTokens: number, outputTokens: number): void {
  const cost =
    (inputTokens / 1_000_000) * PRICE_INPUT_PER_M +
    (outputTokens / 1_000_000) * PRICE_OUTPUT_PER_M;
  _usageAccumulator.inputTokens += inputTokens;
  _usageAccumulator.outputTokens += outputTokens;
  _usageAccumulator.cost += cost;
  console.log(
    `[analyzer] Tokens: ${inputTokens} in / ${outputTokens} out ($${cost.toFixed(4)})`
  );
}

// ── Claude API ──

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    _client = new Anthropic();
  }
  return _client;
}

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  const client = getClient();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  // Track token usage
  trackUsage(message.usage.input_tokens, message.usage.output_tokens);

  // Extract text from the response
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  return textBlock.text;
}

/** Parse JSON from Claude response, stripping markdown fences if present */
function parseJsonResponse<T>(raw: string): T {
  let cleaned = raw.trim();

  // Strip markdown code fences
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  return JSON.parse(cleaned) as T;
}

// ── Business Analysis (2A) ──

export async function generateBusinessAnalysis(
  scraped: ScrapedData,
  input: ProspectInput
): Promise<BusinessAnalysis> {
  const industry = INDUSTRIES[input.industry];

  try {
    const prompt = buildAnalysisPrompt(scraped, industry);
    console.log(
      `[analyzer] Generating business analysis (${(prompt.length / 1000).toFixed(1)}k chars prompt)...`
    );

    const response = await callClaude(
      "You are an expert local business analyst and conversion copywriter. You return only valid JSON.",
      prompt,
      4000
    );

    return parseJsonResponse<BusinessAnalysis>(response);
  } catch (err) {
    console.error(`[analyzer] Business analysis failed: ${err}`);
    console.log("[analyzer] Using fallback analysis from industry defaults");
    return buildFallbackAnalysis(scraped, input, industry);
  }
}

// ── Competitive Intelligence (2B) ──

export async function generateCompetitiveIntel(
  scraped: ScrapedData,
  input: ProspectInput
): Promise<CompetitiveIntel> {
  const industry = INDUSTRIES[input.industry];

  try {
    const prompt = buildIntelPrompt(scraped, industry, input.location);
    console.log(
      `[analyzer] Generating competitive intel (${(prompt.length / 1000).toFixed(1)}k chars prompt)...`
    );

    const response = await callClaude(
      "You are a local market analyst specializing in competitive intelligence for local service businesses. You return only valid JSON.",
      prompt,
      2000
    );

    return parseJsonResponse<CompetitiveIntel>(response);
  } catch (err) {
    console.error(`[analyzer] Competitive intel failed: ${err}`);
    console.log("[analyzer] Using fallback competitive intel");
    return buildFallbackIntel(scraped, input, industry);
  }
}

// ── Build Brief (2C) ──

export async function generateBuildBrief(
  analysis: BusinessAnalysis,
  scraped: ScrapedData,
  input: ProspectInput
): Promise<string> {
  const industry = INDUSTRIES[input.industry];
  return buildBriefPrompt(analysis, scraped, industry);
}

// ── Site Plan (for website builder) ──

export async function generateSitePlan(
  scraped: ScrapedData,
  analysis: BusinessAnalysis
): Promise<string> {
  const prompt = buildSitePlanPrompt(scraped, analysis);
  console.log(
    `[analyzer] Generating site plan (${(prompt.length / 1000).toFixed(1)}k chars prompt)...`
  );

  const response = await callClaude(
    "You are an expert web strategist and UX copywriter for local service businesses. You return only valid JSON.",
    prompt,
    8000
  );

  // Validate it's valid JSON before returning
  const parsed = parseJsonResponse<Record<string, unknown>>(response);
  return JSON.stringify(parsed);
}

// ── Master orchestrator ──

export async function analyzeAll(
  scraped: ScrapedData,
  input: ProspectInput
): Promise<{
  analysis: BusinessAnalysis;
  intel: CompetitiveIntel;
  buildBrief: string;
}> {
  console.log("[analyzer] Starting analysis phase (2 Claude API calls in parallel)...");

  // Run business analysis and competitive intel in parallel
  const [analysis, intel] = await Promise.all([
    generateBusinessAnalysis(scraped, input),
    generateCompetitiveIntel(scraped, input),
  ]);

  // Build brief depends on analysis result — runs sequentially
  const buildBrief = await generateBuildBrief(analysis, scraped, input);

  console.log("[analyzer] Analysis phase complete");
  return { analysis, intel, buildBrief };
}

// ── Fallbacks ──

function buildFallbackAnalysis(
  scraped: ScrapedData,
  input: ProspectInput,
  industry: IndustryConfig
): BusinessAnalysis {
  const gbp = scraped.gbp;
  const site = scraped.crawledSite;
  const name = gbp?.name ?? site?.brandInfo.businessName ?? input.businessName;
  const phone = gbp?.phone ?? site?.contactInfo.phone ?? "";
  const address = gbp?.address ?? site?.contactInfo.address ?? input.location;

  // Use crawled services if available, otherwise industry defaults
  const services =
    site && site.services.length >= 3
      ? site.services.slice(0, 6).map((s) => ({
          name: s.name,
          headline: s.name,
          description: s.description || `Professional ${s.name.toLowerCase()} services.`,
          icon: "🔧",
        }))
      : industry.defaultServices.map((s) => ({
          name: s.name,
          headline: s.name,
          description: s.desc,
          icon: s.icon,
        }));

  return {
    businessSummary: `${name} is a trusted ${industry.name.toLowerCase()} provider serving ${input.location} and surrounding areas.`,
    differentiators: [
      `Serving the ${input.location} community`,
      gbp && gbp.rating >= 4 ? `${gbp.rating}-star rated on Google` : "Committed to quality service",
      gbp && gbp.reviewCount > 0 ? `${gbp.reviewCount} verified customer reviews` : "Dedicated to customer satisfaction",
      industry.whyChoose[0]?.title ?? "Professional and reliable",
    ],
    brandVoice: "professional",
    siteSections: {
      hero: {
        headline: `Trusted ${industry.name} Services in ${input.location}`,
        subheadline: `${name} provides professional, reliable ${industry.name.toLowerCase()} services to homes and businesses throughout ${input.location}. Call us today for a free estimate.`,
        ctaPrimary: `Call ${phone || "Us Now"}`,
        ctaSecondary: "View Our Services",
      },
      services,
      about: {
        headline: `About ${name}`,
        paragraphs: [
          `${name} has been proudly serving ${input.location} with top-quality ${industry.name.toLowerCase()} services. Our team of experienced professionals is committed to delivering exceptional results on every job.`,
          `We believe in honest pricing, reliable service, and building lasting relationships with our customers. When you choose ${name}, you're choosing a team that treats your home or business like their own.`,
        ],
      },
      whyChooseUs: industry.whyChoose.map((w) => ({
        title: w.title,
        description: w.desc,
      })),
      serviceArea: {
        headline: `Serving ${input.location} and Beyond`,
        description: `${name} is proud to serve customers throughout ${input.location} and the surrounding communities. No matter where you are in the area, we're just a phone call away.`,
        towns: [input.location],
      },
      cta: {
        headline: `Ready to Get Started?`,
        description: `Don't wait — contact ${name} today for fast, professional ${industry.name.toLowerCase()} service you can count on.`,
        buttonText: `Call ${phone || "Now"}`,
      },
      footer: {
        description: `${name} — professional ${industry.name.toLowerCase()} services in ${input.location}. Licensed, insured, and committed to your satisfaction.`,
      },
    },
    seo: {
      title: `${name} | ${industry.name} in ${input.location}`,
      description: `${name} provides professional ${industry.name.toLowerCase()} services in ${input.location}. Call today for a free estimate.`,
      h1: `Trusted ${industry.name} Services in ${input.location}`,
      keywords: [
        `${industry.name.toLowerCase()} ${input.location}`,
        ...industry.searchTerms.slice(0, 5),
        name.toLowerCase(),
        `${input.location} ${industry.name.toLowerCase()}`,
      ],
    },
    designNotes: {
      suggestedPrimaryColor: site?.brandInfo.primaryColor ?? "#1a2744",
      suggestedAccentColor: "#e8763a",
      tone: "professional",
      layoutStyle: "Clean, trust-focused layout with prominent CTAs and social proof",
    },
  };
}

function buildFallbackIntel(
  scraped: ScrapedData,
  input: ProspectInput,
  industry: IndustryConfig
): CompetitiveIntel {
  const gbp = scraped.gbp;
  const competitors = scraped.competitors;
  const audit = scraped.audit;
  const name = gbp?.name ?? input.businessName;

  const prospectReviews = gbp?.reviewCount ?? 0;
  const topCompetitor = competitors[0];
  const topCompetitorReviews = topCompetitor?.reviewCount ?? 50;

  const gaps: CompetitiveIntel["competitiveGaps"] = [];

  // Reviews gap
  if (topCompetitor) {
    gaps.push({
      category: "Reviews & Reputation",
      yours: `${prospectReviews} reviews, ${gbp?.rating ?? "N/A"}★`,
      topCompetitor: `${topCompetitorReviews} reviews, ${topCompetitor.rating}★`,
      impact: "Google heavily weights review volume and recency when ranking local businesses. A significant review gap means competitors appear more trustworthy to both Google and potential customers.",
      fix: "Implement a systematic review generation campaign — follow up with every completed job via text/email with a direct Google review link.",
    });
  }

  // Website content gap
  if (topCompetitor?.homepageWordCount) {
    gaps.push({
      category: "Website Content",
      yours: audit ? `Performance ${audit.scores.performance}/100` : "Limited website data",
      topCompetitor: `${topCompetitor.homepageWordCount} words on homepage${topCompetitor.serviceCount ? `, ${topCompetitor.serviceCount} service pages` : ""}`,
      impact: "Thin website content signals low authority to Google. Competitors with more detailed service pages rank higher for specific service searches.",
      fix: "Build out dedicated service pages with detailed, unique content for each service offered.",
    });
  }

  // Technical SEO gap
  if (audit) {
    gaps.push({
      category: "Technical SEO",
      yours: `Performance: ${audit.scores.performance}/100, SEO: ${audit.scores.seo}/100, Mobile: ${audit.mobileReady ? "Yes" : "No"}`,
      topCompetitor: competitors.some((c) => c.hasSchema) ? "Schema markup detected on competitors" : "Competitor technical data limited",
      impact: "Poor site performance and missing schema markup make it harder for Google to understand and rank your business. Slow sites also lose visitors before they call.",
      fix: "Rebuild with modern, fast-loading architecture, add LocalBusiness schema markup, and ensure full mobile responsiveness.",
    });
  }

  // GBP gap
  if (gbp) {
    gaps.push({
      category: "Google Business Profile",
      yours: `Completeness: ${gbp.completenessScore}/100`,
      topCompetitor: "Top competitors maintain fully optimized profiles",
      impact: "An incomplete Google Business Profile means you're less likely to appear in map pack results. Google prioritizes businesses with complete, active profiles.",
      fix: "Complete all GBP fields — add business hours, service area, categories, photos, and respond to every review.",
    });
  }

  return {
    marketSnapshot: `The ${industry.name.toLowerCase()} market in ${input.location} is competitive with ${competitors.length} active businesses in the Google Maps results.`,
    mapPackAnalysis: topCompetitor
      ? `${topCompetitor.name} leads the map pack with ${topCompetitorReviews} reviews and a ${topCompetitor.rating} rating.`
      : "Map pack data not available.",
    prospectPosition: `With ${prospectReviews} reviews, ${name} has significant room for growth compared to top competitors.`,
    keyFindings: [
      `Review gap: ${prospectReviews} reviews vs top competitor's ${topCompetitorReviews}`,
      gbp ? `GBP completeness: ${gbp.completenessScore}/100` : "Google Business Profile needs optimization",
      audit
        ? `Website performance: ${audit.scores.performance}/100`
        : "Website audit data not available",
    ].filter(Boolean),
    competitiveGaps: gaps,
    topRecommendations: [
      {
        action: "Optimize Google Business Profile",
        why: gbp ? `Your GBP is only ${gbp.completenessScore}% complete — competitors with fuller profiles get more visibility.` : "An optimized GBP is the foundation of local search visibility.",
        howCalverdaHelps: `Calverda handles full GBP optimization for ${industry.name.toLowerCase()} businesses — from category selection to photo strategy to review response management.`,
      },
      {
        action: "Build a modern, SEO-optimized website",
        why: audit ? `Your site scores ${audit.scores.performance}/100 on performance. Slow, outdated sites lose visitors before they ever call.` : "A professional website is essential for converting search visitors into customers.",
        howCalverdaHelps: `Calverda builds conversion-optimized websites with built-in local SEO, schema markup, and mobile-first performance — designed specifically for ${industry.name.toLowerCase()} businesses.`,
      },
      {
        action: "Launch a review generation strategy",
        why: `You have ${prospectReviews} reviews vs the top competitor's ${topCompetitorReviews}. Closing the review gap is the single highest-impact action for local rankings.`,
        howCalverdaHelps: "Calverda sets up automated review request campaigns that integrate with your existing workflow — making it effortless to build your online reputation.",
      },
    ],
    urgencyNote: "Competitors are actively gaining reviews and visibility — every month of inaction widens the gap.",
  };
}

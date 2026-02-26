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

const MODEL = "claude-sonnet-4-20250514";

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

  const prospectReviews = gbp?.reviewCount ?? 0;
  const topCompetitorReviews = competitors[0]?.reviewCount ?? 50;

  // Revenue gap based on review differential (verifiable data)
  // Logic: review count correlates with call volume in local service businesses
  const reviewGap = Math.max(topCompetitorReviews - prospectReviews, 10);
  const avgJobValue =
    (industry.avgTicket.service * 3 + industry.avgTicket.install) / 4;
  // Each review roughly represents 10-20 customers (most don't leave reviews)
  const estimatedMissedCustomers = reviewGap * 1.5;
  const missedJobs = estimatedMissedCustomers * industry.closeRate;
  const monthlyHigh = Math.round(missedJobs * avgJobValue);
  const monthlyLow = Math.round(monthlyHigh * 0.7);

  return {
    marketSnapshot: `The ${industry.name.toLowerCase()} market in ${input.location} is competitive with ${competitors.length} active businesses in the Google Maps results.`,
    mapPackAnalysis: competitors.length > 0
      ? `${competitors[0].name} leads the map pack with ${competitors[0].reviewCount} reviews and a ${competitors[0].rating} rating.`
      : "Map pack data not available.",
    prospectPosition: `With ${prospectReviews} reviews, ${gbp?.name ?? input.businessName} has significant room for growth compared to top competitors.`,
    keyFindings: [
      `Review gap: ${prospectReviews} reviews vs top competitor's ${topCompetitorReviews}`,
      gbp ? `GBP completeness: ${gbp.completenessScore}/100` : "Google Business Profile needs optimization",
      scraped.audit
        ? `Website performance: ${scraped.audit.scores.performance}/100`
        : "Website audit data not available",
    ].filter(Boolean),
    revenueOpportunity: {
      monthlyLow,
      monthlyHigh,
      annualLow: monthlyLow * 12,
      annualHigh: monthlyHigh * 12,
      methodology: `Based on ${reviewGap}-review gap with top competitor, ${(industry.closeRate * 100).toFixed(0)}% close rate, and $${avgJobValue.toFixed(0)} average job value for ${industry.name.toLowerCase()}.`,
    },
    topRecommendations: [
      "Optimize Google Business Profile — complete all fields, add photos, respond to reviews",
      "Build a modern, mobile-optimized website with strong local SEO",
      "Implement a review generation strategy to close the review gap",
    ],
    urgencyNote: `Competitors are actively gaining reviews and visibility — every month of inaction widens the gap.`,
  };
}

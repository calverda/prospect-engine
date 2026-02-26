import type { ScrapedData } from "@/lib/pipeline/types";
import type { IndustryConfig } from "@/lib/config/industries";

export function buildAnalysisPrompt(
  scraped: ScrapedData,
  industry: IndustryConfig
): string {
  const site = scraped.crawledSite;
  const gbp = scraped.gbp;

  let prompt = `I've crawled a ${industry.name} business's website and Google Business Profile.
Analyze everything and generate the complete content for a new, high-converting website.\n\n`;

  // ── Website content ──
  if (site) {
    prompt += `## THEIR CURRENT WEBSITE CONTENT\nURL: ${site.url}\n`;
    prompt += site.pages
      .slice(0, 8) // cap pages to avoid token overflow
      .map((p) => `### ${p.title}\n${p.bodyText.slice(0, 2000)}`)
      .join("\n\n");
    prompt += "\n\n";

    if (site.services.length > 0) {
      prompt += `## THEIR CURRENT SERVICES (extracted from website)\n`;
      prompt += site.services
        .map((s) => `- ${s.name}: ${s.description}`)
        .join("\n");
      prompt += "\n\n";
    }

    if (site.aboutContent) {
      prompt += `## THEIR ABOUT CONTENT\n${site.aboutContent.slice(0, 2000)}\n\n`;
    }

    prompt += `## THEIR CONTACT INFO (from website)\n`;
    prompt += `Phone: ${site.contactInfo.phone ?? "Not found"}\n`;
    prompt += `Email: ${site.contactInfo.email ?? "Not found"}\n`;
    prompt += `Address: ${site.contactInfo.address ?? "Not found"}\n`;
    if (site.contactInfo.hours) {
      prompt += `Hours: ${site.contactInfo.hours}\n`;
    }
    prompt += "\n";

    if (site.testimonials.length > 0) {
      prompt += `## TESTIMONIALS FROM THEIR SITE\n`;
      prompt += site.testimonials
        .slice(0, 5)
        .map((t) => `- "${t}"`)
        .join("\n");
      prompt += "\n\n";
    }

    if (site.brandInfo.primaryColor) {
      prompt += `## THEIR CURRENT BRANDING\n`;
      prompt += `Primary color: ${site.brandInfo.primaryColor}\n`;
      if (site.brandInfo.tagline)
        prompt += `Tagline: ${site.brandInfo.tagline}\n`;
      prompt += "\n";
    }
  }

  // ── GBP data ──
  if (gbp) {
    prompt += `## THEIR GOOGLE BUSINESS PROFILE\n`;
    prompt += `Name: ${gbp.name}\n`;
    prompt += `Rating: ${gbp.rating} (${gbp.reviewCount} reviews)\n`;
    prompt += `Phone: ${gbp.phone}\n`;
    prompt += `Address: ${gbp.address}\n`;
    if (gbp.hours.length > 0) {
      prompt += `Hours: ${gbp.hours.join(", ")}\n`;
    }
    if (gbp.categories.length > 0) {
      prompt += `Categories: ${gbp.categories.join(", ")}\n`;
    }
    prompt += `GBP Completeness: ${gbp.completenessScore}/100\n\n`;

    if (gbp.reviews.length > 0) {
      prompt += `## THEIR REVIEWS (sample — use these for tone reference)\n`;
      prompt += gbp.reviews
        .slice(0, 10)
        .map((r) => `${r.rating}★ — "${r.text.slice(0, 300)}"`)
        .join("\n");
      prompt += "\n\n";
    }
  }

  // ── Industry defaults as fallback context ──
  prompt += `## INDUSTRY: ${industry.name}\n`;
  prompt += `Default services for this industry (use if website services are sparse):\n`;
  prompt += industry.defaultServices
    .map((s) => `- ${s.name}: ${s.desc}`)
    .join("\n");
  prompt += "\n\n";

  // ── Output format ──
  prompt += `---

Based on ALL of this data, generate the following JSON object. Be specific to THIS business — use their actual services, their actual location, their actual differentiators. Don't be generic. The copy should feel like it was written by someone who deeply understands their business.

{
  "businessSummary": "2-3 sentence summary of what this business does and who they serve",
  "differentiators": ["3-4 things that make them unique, extracted from their content and reviews"],
  "brandVoice": "brief description of their brand voice/tone based on their content",

  "siteSections": {
    "hero": {
      "headline": "compelling H1 with city/area name — under 10 words",
      "subheadline": "2-3 sentence supporting copy that builds trust",
      "ctaPrimary": "primary button text (e.g. 'Call Now')",
      "ctaSecondary": "secondary button text (e.g. 'View Services')"
    },
    "services": [
      {
        "name": "service name",
        "headline": "short service headline (3-6 words)",
        "description": "2-3 sentence description optimized for this specific business",
        "icon": "single relevant emoji"
      }
    ],
    "about": {
      "headline": "section headline",
      "paragraphs": ["2-3 paragraphs about the business, written warmly and professionally"]
    },
    "whyChooseUs": [
      {
        "title": "short benefit title (2-5 words)",
        "description": "1-2 sentence explanation"
      }
    ],
    "serviceArea": {
      "headline": "section headline with area name",
      "description": "paragraph about their coverage area",
      "towns": ["list of 8-12 towns they likely serve based on their address"]
    },
    "cta": {
      "headline": "compelling closing headline",
      "description": "urgency-building paragraph",
      "buttonText": "CTA button text"
    },
    "footer": {
      "description": "2-sentence business description for footer"
    }
  },

  "seo": {
    "title": "SEO page title (under 60 chars, include location)",
    "description": "meta description (under 160 chars, include primary service + location)",
    "h1": "main H1 tag (same as hero headline)",
    "keywords": ["8-10 target keywords for this business and location"]
  },

  "designNotes": {
    "suggestedPrimaryColor": "hex color that fits their brand (use their existing color if detected, otherwise choose appropriately)",
    "suggestedAccentColor": "hex color for CTAs — high contrast with primary",
    "tone": "one of: warm, professional, modern, traditional, premium, friendly",
    "layoutStyle": "brief description of recommended layout approach"
  }
}

Important:
- Generate 4-8 services based on what you found on their site/GBP. Fall back to industry defaults if sparse.
- Generate exactly 4 whyChooseUs items.
- Every piece of copy should reference their specific business, location, and services — NOT generic placeholder text.
- Return ONLY valid JSON. No markdown, no explanation.`;

  return prompt;
}

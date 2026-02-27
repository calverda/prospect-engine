import type { ScrapedData } from "@/lib/pipeline/types";
import type { IndustryConfig } from "@/lib/config/industries";

export function buildAnalysisPrompt(
  scraped: ScrapedData,
  industry: IndustryConfig
): string {
  const site = scraped.crawledSite;
  const gbp = scraped.gbp;

  // ── Measure data quality ──
  const totalBodyText = site
    ? site.pages.reduce((sum, p) => sum + p.bodyText.length, 0)
    : 0;
  const hasSubstantialContent = totalBodyText > 500;
  const hasServices = site ? site.services.length > 0 : false;
  const hasGBP = !!gbp;

  let prompt = `I've scraped data from a ${industry.name} business. Generate content for a new, high-converting website based ONLY on verifiable information.\n\n`;

  // ── Data quality warning ──
  prompt += `## DATA QUALITY ASSESSMENT\n`;
  prompt += `Website content scraped: ${hasSubstantialContent ? "YES — use it" : "MINIMAL or NONE — the site may use JavaScript rendering that our crawler cannot process"}\n`;
  prompt += `Total text extracted: ${totalBodyText} characters\n`;
  prompt += `Services found on site: ${hasServices ? `YES (${site!.services.length})` : "NONE"}\n`;
  prompt += `Google Business Profile found: ${hasGBP ? "YES" : "NO — this business does NOT have a verified GBP listing"}\n\n`;

  if (!hasSubstantialContent) {
    prompt += `⚠️ IMPORTANT: Very little content was extracted from the website. This likely means the site uses JavaScript rendering (React, Wix, Squarespace, etc.) that our crawler cannot process. DO NOT invent or guess content that isn't in the data below. Use only what is explicitly provided. For anything you cannot verify, use generic but honest industry copy and mark it as industry-standard rather than business-specific.\n\n`;
  }

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
    prompt += `## THEIR GOOGLE BUSINESS PROFILE (VERIFIED — this data is real)\n`;
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
  } else {
    prompt += `## GOOGLE BUSINESS PROFILE\nNot found. This business does NOT have a verified Google Business Profile. Do NOT reference any GBP rating, reviews, or review count in the generated content.\n\n`;
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

Based on the data above, generate the following JSON object. Use ONLY facts that appear in the scraped data. If the data is thin (see the DATA QUALITY ASSESSMENT above), write professional industry-appropriate copy but do NOT invent specific claims about the business (like years in business, number of projects, team size, or specific certifications) unless that information appears in the data above.

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
      "towns": ["ONLY include towns explicitly mentioned on their website or GBP. If none found, return a single-item array with just the city from their address."]
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
- Generate 4-8 services based on what you found on their site/GBP. If the website content is thin or empty, use standard ${industry.name.toLowerCase()} services but do NOT claim these are services the business specifically offers — frame them generically.
- Generate exactly 4 whyChooseUs items.
- If GBP data was NOT found, do NOT mention reviews, ratings, or "five-star" anything in the copy.
- Do NOT invent business history, founding year, team size, years of experience, or any specific claims unless they appear in the scraped data.
- The "towns" array must ONLY contain towns explicitly found in the scraped content. If none were found, use just the provided location city.
- The "differentiators" must come from the actual scraped content. If content is thin, use honest industry-appropriate differentiators like "Serving [location]" rather than fabricated specifics.
- Return ONLY valid JSON. No markdown, no explanation.`;

  return prompt;
}

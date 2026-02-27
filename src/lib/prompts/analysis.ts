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

  let prompt = `I've scraped data from a ${industry.name} business. Generate the complete content for a new, high-converting website. Use real data where available and build out with strong industry-appropriate content where data is thin.\n\n`;

  // ── Data quality warning ──
  prompt += `## DATA QUALITY ASSESSMENT\n`;
  prompt += `Website content scraped: ${hasSubstantialContent ? "YES — use it as the primary source" : "MINIMAL or NONE — build from industry expertise + whatever data exists"}\n`;
  prompt += `Total text extracted: ${totalBodyText} characters\n`;
  prompt += `Services found on site: ${hasServices ? `YES (${site!.services.length})` : "NONE — use industry defaults for this type of business"}\n`;
  prompt += `Google Business Profile found: ${hasGBP ? "YES — use real rating and reviews" : "NO — do not reference any Google rating or review count"}\n\n`;

  if (!hasSubstantialContent) {
    prompt += `NOTE: Limited content was extracted from their website. Your job is to build them a BETTER site than what they have. Use the industry defaults below to create a full, compelling service offering. Use their real contact info and location. Write professional copy that positions them well in their market. Just don't invent specific factual claims about the business itself (years in business, team size, certifications, awards) unless that info appears in the data.\n\n`;
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
    prompt += `## GOOGLE BUSINESS PROFILE\nNot found. Do NOT reference a Google rating, star count, or review count in generated copy. You can still write compelling trust-building content using other approaches (service guarantees, licensing, experience, etc.).\n\n`;
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

Based on the data above, generate the following JSON object. Your goal is to create a site that is dramatically better than their current one — a site that shows them what's possible. Use real business data (name, phone, address, services) where available. For thin data, build out compelling content using industry expertise. The only things you must NOT fabricate are specific factual claims about THIS business (years in business, team size, certifications, awards, specific project counts) unless they appear in the scraped data.

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
- Generate 4-8 services. Use services found on their site/GBP first. If thin, build out a full service offering using industry defaults — present them as services this type of business typically offers.
- Generate exactly 4 whyChooseUs items — use industry-appropriate benefits (e.g. "Licensed & Insured", "Free Estimates", "Satisfaction Guaranteed").
- If GBP data was NOT found, do NOT mention a Google rating, star rating, or review count. You CAN still write trust-building copy without referencing reviews.
- Do NOT invent specific factual claims: no fake founding year, team size, project count, or certifications unless in the data.
- The "towns" array: use towns from the scraped data. If none found, include the provided location city plus 4-6 nearby towns that a ${industry.name.toLowerCase()} business in that area would realistically serve.
- Write copy that sells — this site needs to be so much better than their current one that they want to buy it.
- Return ONLY valid JSON. No markdown, no explanation.`;

  return prompt;
}

import type { ScrapedData, BusinessAnalysis } from "@/lib/pipeline/types";

export function buildSitePlanPrompt(
  scraped: ScrapedData,
  analysis: BusinessAnalysis
): string {
  const site = scraped.crawledSite;
  const gbp = scraped.gbp;

  let prompt = `You are a senior web strategist and UX copywriter. Analyze this local business's
existing website and generate a complete, structured content plan for an improved multi-page website.

Your job is to:
1. Identify every problem with their current site (redundancy, missing pages, bad SEO, weak copy)
2. Reorganize and rewrite ALL content for maximum conversion and SEO
3. Output a structured JSON that a template website will consume directly

## EXISTING BUSINESS ANALYSIS (already completed)
${JSON.stringify(analysis, null, 2)}

`;

  // ── Current website pages ──
  if (site) {
    prompt += `## THEIR CURRENT WEBSITE\nURL: ${site.url}\n`;
    prompt += `Total pages crawled: ${site.pages.length}\n\n`;

    prompt += `### PAGE-BY-PAGE BREAKDOWN\n`;
    for (const page of site.pages.slice(0, 12)) {
      prompt += `**${page.title}** (${page.url})\n`;
      prompt += `Word count: ${page.wordCount} | Headings: ${page.headings.slice(0, 5).join(", ")}\n`;
      prompt += `Content preview: ${page.bodyText.slice(0, 1500)}\n\n`;
    }

    if (site.services.length > 0) {
      prompt += `### SERVICES FOUND ON THEIR SITE\n`;
      prompt += site.services
        .map((s) => `- ${s.name}: ${s.description} ${s.pageUrl ? `(${s.pageUrl})` : ""}`)
        .join("\n");
      prompt += "\n\n";
    }

    if (site.aboutContent) {
      prompt += `### THEIR ABOUT CONTENT\n${site.aboutContent.slice(0, 2000)}\n\n`;
    }

    if (site.testimonials.length > 0) {
      prompt += `### TESTIMONIALS FROM THEIR SITE\n`;
      prompt += site.testimonials
        .slice(0, 8)
        .map((t) => `- "${t}"`)
        .join("\n");
      prompt += "\n\n";
    }

    prompt += `### CURRENT SEO STATE\n`;
    prompt += `Title: ${site.seoMeta.title}\n`;
    prompt += `Description: ${site.seoMeta.description}\n`;
    prompt += `Tech stack: ${site.techStack.join(", ") || "Unknown"}\n\n`;
  }

  // ── GBP data ──
  if (gbp) {
    prompt += `## GOOGLE BUSINESS PROFILE\n`;
    prompt += `Name: ${gbp.name}\n`;
    prompt += `Rating: ${gbp.rating} (${gbp.reviewCount} reviews)\n`;
    prompt += `Phone: ${gbp.phone}\n`;
    prompt += `Address: ${gbp.address}\n`;
    prompt += `Hours: ${gbp.hours.join(", ") || "Not listed"}\n`;
    prompt += `Categories: ${gbp.categories.join(", ")}\n\n`;

    if (gbp.reviews.length > 0) {
      prompt += `### REAL REVIEWS (use these — they're gold for trust signals)\n`;
      prompt += gbp.reviews
        .filter((r) => r.rating >= 4)
        .slice(0, 8)
        .map((r) => `${r.rating}★ by ${r.author}: "${r.text.slice(0, 400)}"`)
        .join("\n");
      prompt += "\n\n";
    }
  }

  // ── Audit data ──
  if (scraped.audit) {
    prompt += `## CURRENT SITE PERFORMANCE\n`;
    prompt += `Performance: ${scraped.audit.scores.performance}/100\n`;
    prompt += `SEO score: ${scraped.audit.scores.seo}/100\n`;
    prompt += `Mobile ready: ${scraped.audit.mobileReady ? "Yes" : "No"}\n`;
    prompt += `HTTPS: ${scraped.audit.hasHTTPS ? "Yes" : "No"}\n`;
    if (scraped.audit.seoIssues.length > 0) {
      prompt += `SEO issues: ${scraped.audit.seoIssues.map((i) => i.title).join(", ")}\n`;
    }
    prompt += "\n";
  }

  // ── Competitor context ──
  if (scraped.competitors.length > 0) {
    prompt += `## TOP COMPETITORS (for context on what's working in this market)\n`;
    for (const c of scraped.competitors.slice(0, 5)) {
      prompt += `- ${c.name}: ${c.rating}★ (${c.reviewCount} reviews)`;
      if (c.website) prompt += ` | ${c.website}`;
      if (c.serviceCount) prompt += ` | ${c.serviceCount} services listed`;
      prompt += "\n";
    }
    prompt += "\n";
  }

  // ── Output spec ──
  prompt += `---

## YOUR TASK

Generate the complete content.json for an improved multi-page website. This JSON will be consumed
directly by a Next.js template — every field matters.

CRITICAL RULES:
- Use REAL data from the business (real phone, real address, real services, real reviews)
- Every piece of copy must be specific to THIS business — no generic filler
- Identify redundant/duplicate pages from their current site and consolidate them
- Rewrite weak copy for conversion — short punchy headlines, clear value props, strong CTAs
- Every service gets its own dedicated page with unique, substantial content
- All phone CTAs must use their actual phone number
- SEO: unique title/description per page, proper H1s, location keywords naturally included

Return ONLY valid JSON matching this exact structure:

{
  "business": {
    "name": "Their actual business name",
    "phone": "Their actual phone number",
    "email": "Their email or null",
    "address": "Their full address",
    "hours": ["Mon-Fri: 8am-6pm", "Sat: 9am-2pm"],
    "logo": "URL to their logo or null"
  },
  "design": {
    "primaryColor": "#hex — use their existing brand color if detected, otherwise pick a strong one for their industry",
    "accentColor": "#hex — high contrast CTA color",
    "tone": "warm | professional | modern | traditional | premium | friendly"
  },
  "seo": {
    "siteTitle": "Business Name — Primary Service in City, State",
    "siteDescription": "Meta description for homepage (under 160 chars)",
    "keywords": ["8-12 target keywords mixing service + location terms"],
    "jsonLd": {
      "type": "LocalBusiness",
      "name": "...",
      "telephone": "...",
      "address": { "streetAddress": "...", "city": "...", "state": "...", "zip": "..." },
      "geo": { "latitude": 0, "longitude": 0 },
      "openingHours": ["Mo-Fr 08:00-18:00"],
      "aggregateRating": { "ratingValue": 0, "reviewCount": 0 }
    }
  },
  "pages": {
    "home": {
      "seo": { "title": "unique page title", "description": "unique meta description" },
      "hero": {
        "headline": "Compelling H1 with city name — under 10 words",
        "subheadline": "2-3 sentences building trust and urgency",
        "ctaPrimary": { "text": "Call Now — (555) 123-4567", "href": "tel:+15551234567" },
        "ctaSecondary": { "text": "View Our Services", "href": "/services" },
        "stats": [
          { "value": "20+", "label": "Years Experience" },
          { "value": "500+", "label": "Projects Completed" },
          { "value": "4.9★", "label": "Google Rating" }
        ]
      },
      "trustBar": [
        { "icon": "shield", "text": "Licensed & Insured" },
        { "icon": "clock", "text": "24/7 Emergency Service" },
        { "icon": "award", "text": "5-Star Rated" },
        { "icon": "check", "text": "Free Estimates" }
      ],
      "servicesSummary": [
        {
          "slug": "service-slug",
          "name": "Service Name",
          "description": "1-2 sentence summary",
          "icon": "emoji"
        }
      ],
      "aboutPreview": {
        "headline": "Why City Trusts Business Name",
        "text": "2-3 sentences about the business",
        "link": "/about"
      },
      "testimonials": [
        {
          "text": "Actual review text — use real reviews from GBP",
          "author": "Real Name",
          "rating": 5
        }
      ],
      "cta": {
        "headline": "Ready to Get Started?",
        "description": "Urgency-building paragraph",
        "buttonText": "Call Now",
        "buttonHref": "tel:+15551234567"
      }
    },
    "services": [
      {
        "slug": "kitchen-remodeling",
        "name": "Kitchen Remodeling",
        "seo": { "title": "Kitchen Remodeling in City — Business Name", "description": "..." },
        "headline": "Professional Kitchen Remodeling in City",
        "description": "3-4 paragraphs of substantial, unique content about this specific service. Include what's involved, their approach, materials, timeline expectations. NOT generic filler.",
        "features": [
          { "title": "Feature name", "description": "1-2 sentences" }
        ],
        "gallery": [],
        "cta": {
          "headline": "Get a Free Kitchen Remodeling Estimate",
          "buttonText": "Call Now",
          "buttonHref": "tel:+15551234567"
        }
      }
    ],
    "about": {
      "seo": { "title": "About Business Name — Trusted Service in City", "description": "..." },
      "headline": "About Business Name",
      "paragraphs": ["3-4 paragraphs about the business — history, values, approach. Use real details from their site."],
      "whyChooseUs": [
        { "title": "Short benefit", "description": "1-2 sentence explanation", "icon": "emoji" }
      ],
      "team": []
    },
    "contact": {
      "seo": { "title": "Contact Business Name — Free Estimates in City", "description": "..." },
      "headline": "Contact Us",
      "description": "Brief paragraph encouraging contact",
      "serviceArea": {
        "headline": "Serving City and Surrounding Areas",
        "description": "Paragraph about their coverage area",
        "towns": ["Town1", "Town2", "Town3"]
      }
    }
  },
  "improvements": [
    "Specific improvement vs their current site — e.g. 'Consolidated 3 duplicate roofing pages into 1 comprehensive service page'",
    "Another specific improvement — e.g. 'Added missing H1 tags on all pages'",
    "Be specific and reference their actual current site issues"
  ]
}

IMPORTANT NOTES:
- Generate 4-8 service pages based on their actual services. Each service page needs substantial unique content (not copy-paste).
- The "improvements" array should have 5-10 specific, actionable items that reference actual problems you found on their current site.
- Stats in hero should use real numbers (real rating, real review count, real years in business) — estimate conservatively if not explicitly stated.
- trustBar items should reflect what they actually offer (don't say "24/7 Emergency" if they're not that type of business).
- Use the towns from the existing analysis serviceArea data.
- Return ONLY valid JSON. No markdown, no explanation, no code fences.`;

  return prompt;
}

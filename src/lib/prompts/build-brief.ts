import type { BusinessAnalysis, ScrapedData } from "@/lib/pipeline/types";
import type { IndustryConfig } from "@/lib/config/industries";

export function buildBriefPrompt(
  analysis: BusinessAnalysis,
  scraped: ScrapedData,
  industry: IndustryConfig
): string {
  const gbp = scraped.gbp;
  const site = scraped.crawledSite;

  let prompt = `You are a senior web developer and designer. Build a complete,
production-quality Next.js website for this local business.

## BUSINESS CONTEXT
${JSON.stringify(analysis, null, 2)}

## THEIR CURRENT BRANDING
Primary color: ${site?.brandInfo.primaryColor ?? analysis.designNotes.suggestedPrimaryColor}
Logo: ${site?.brandInfo.logoUrl ?? "Generate text-based logo"}

## CONTACT INFO
Phone: ${gbp?.phone ?? "TBD"}
Address: ${gbp?.address ?? "TBD"}
Hours: ${gbp?.hours.join(", ") ?? "TBD"}
Email: ${site?.contactInfo.email ?? "TBD"}
`;

  if (gbp && gbp.reviews.length > 0) {
    prompt += `\n## REAL REVIEWS TO FEATURE\n`;
    prompt += gbp.reviews
      .filter((r) => r.rating >= 4)
      .slice(0, 5)
      .map((r) => `"${r.text}" — ${r.author}`)
      .join("\n");
  }

  prompt += `

## BUILD REQUIREMENTS

### Technical
- Next.js 14+ with App Router, TypeScript, Tailwind CSS
- Single page site with smooth scroll navigation
- Mobile-first responsive design
- Optimized for Core Web Vitals
- Self-contained — no external API calls, no database, purely static

### SEO (Critical)
- Proper meta title and description, Open Graph tags
- LocalBusiness schema markup (JSON-LD) with real business data
- Semantic HTML, image alt text, sitemap, robots.txt

### Design
- Color scheme: ${analysis.designNotes.suggestedPrimaryColor} primary, ${analysis.designNotes.suggestedAccentColor} accent
- Tone: ${analysis.designNotes.tone}
- Google Fonts, subtle scroll animations, trust signals prominent

### Sections
1. Sticky nav with logo, section links, phone CTA button
2. Hero with headline, description, dual CTAs, trust stats
3. Trust bar (licensed, insured, warranty, hours)
4. Services grid
5. About / Why Choose Us
6. Reviews / testimonials
7. Service area with town list
8. Final CTA with phone number
9. Footer with contact info, service links, area links

### Every CTA must be a tel: link to ${gbp?.phone ?? "TBD"}

Use ALL the copy from the analysis. Do not make up new copy.
Build the complete project. Every file. Ready to deploy.`;

  return prompt;
}

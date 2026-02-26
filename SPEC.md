# Calverda Prospect Engine v3 — Technical Specification

## The Concept

You enter a company name and their website URL. You press one button. The system:

1. Crawls their entire website — extracts content, services, branding, structure, contact info
2. Pulls their Google Business Profile — reviews, rating, hours, photos, categories
3. Analyzes their top 5 local competitors — who ranks, why, what they do better
4. Runs a full technical audit — speed, mobile, SEO, accessibility
5. Generates a comprehensive build brief from all collected data
6. Executes the build via Claude Code — creates a GitHub repo, builds a complete production-quality Next.js website, deploys to Vercel
7. Generates a one-page Competitive Intelligence Report
8. Sends you the results: live preview URL + intel report + repo link

The output isn't a template. It's a custom-built site based on deep analysis of their actual business. Every piece of copy, every section, every design decision is informed by their real data and their competitive landscape.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                CALVERDA DASHBOARD                │
│         (Next.js app you run locally)            │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  INPUT: Company Name + Website URL       │    │
│  │  SELECT: Industry  |  Location           │    │
│  │  [  Generate Package  ]                  │    │
│  └──────────────────────────────────────────┘    │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│            PHASE 1: DATA COLLECTION              │
│               (runs in parallel)                 │
│                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │  Website   │ │   Google   │ │ Competitor │   │
│  │  Crawler   │ │  Places    │ │  Scanner   │   │
│  │            │ │  API       │ │            │   │
│  │ • Content  │ │ • Reviews  │ │ • Top 5    │   │
│  │ • Services │ │ • Rating   │ │ • Reviews  │   │
│  │ • About    │ │ • Hours    │ │ • Ratings  │   │
│  │ • Contact  │ │ • Photos   │ │ • Websites │   │
│  │ • Branding │ │ • Category │ │ • Rankings │   │
│  │ • Images   │ │ • Posts    │ │ • Content  │   │
│  │ • Meta     │ │            │ │            │   │
│  │ • Schema   │ │            │ │            │   │
│  └────────────┘ └────────────┘ └────────────┘   │
│                                                  │
│  ┌────────────┐ ┌────────────┐                   │
│  │ PageSpeed  │ │  Traffic   │                   │
│  │ Audit      │ │  Estimate  │                   │
│  │            │ │            │                   │
│  │ • Speed    │ │ • Monthly  │                   │
│  │ • SEO      │ │ • Keywords │                   │
│  │ • Mobile   │ │ • Value    │                   │
│  │ • A11y     │ │            │                   │
│  └────────────┘ └────────────┘                   │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│          PHASE 2: ANALYSIS + BRIEF               │
│          (Claude API — Sonnet)                   │
│                                                  │
│  All scraped data feeds into Claude to produce:  │
│                                                  │
│  1. BUSINESS ANALYSIS                            │
│     • What they do, who they serve               │
│     • Their differentiators from content          │
│     • Service list with descriptions              │
│     • Brand voice / tone assessment               │
│                                                  │
│  2. COMPETITIVE INTELLIGENCE                     │
│     • Who owns the Map Pack and why               │
│     • Review gap + velocity comparison            │
│     • Content gap analysis                        │
│     • Revenue gap calculation                     │
│                                                  │
│  3. BUILD BRIEF (the master prompt)              │
│     • Site structure recommendation               │
│     • All copy — headlines, service descs, CTAs   │
│     • SEO: meta titles, descriptions, schema      │
│     • Design direction based on industry + brand  │
│     • Specific improvements over current site     │
│                                                  │
│  4. INTEL REPORT DATA                            │
│     • Market snapshot for their area              │
│     • Competitor comparison matrix                │
│     • Revenue opportunity number                  │
│     • Key findings in plain language              │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│          PHASE 3: BUILD + DEPLOY                 │
│       (Claude Code via API or CLI)               │
│                                                  │
│  The build brief becomes a prompt to Claude Code │
│  which executes the entire build:                │
│                                                  │
│  1. Creates GitHub repo: [slug]-preview          │
│  2. Scaffolds Next.js + Tailwind project         │
│  3. Builds all pages with custom copy + design   │
│  4. Implements SEO (meta, schema, sitemap)       │
│  5. Optimizes for mobile + performance           │
│  6. Deploys to Vercel                            │
│  7. Returns live URL                             │
│                                                  │
│  Simultaneously:                                 │
│  • Generates the Competitive Intel Report (PDF)  │
│  • Stores everything in the database             │
└───────────────────┬─────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│              OUTPUT: READY TO SEND               │
│                                                  │
│  ✅ Live preview site:  preview.calverda.com/x   │
│  ✅ Intel report:       PDF / web page           │
│  ✅ GitHub repo:        github.com/calverda/x    │
│  ✅ Outreach ready                               │
└─────────────────────────────────────────────────┘
```

---

## Tech Stack

- **Dashboard**: Next.js 14+, TypeScript, Tailwind CSS
- **Database**: SQLite via Drizzle ORM
- **Website builder**: Claude Code (via Anthropic API or CLI subprocess)
- **Preview hosting**: Vercel (auto-deploy from GitHub)
- **Report generation**: React-to-PDF or Puppeteer screenshot
- **Deployment**: Vercel for both dashboard and preview sites

### External APIs

| API | Purpose | Env Var |
|-----|---------|---------|
| Google Places API | GBP data | `GOOGLE_PLACES_API_KEY` |
| SerpAPI | Competitor + SERP data | `SERPAPI_KEY` |
| Google PageSpeed Insights | Site audit (free) | — |
| Anthropic Claude API | Analysis + copy generation | `ANTHROPIC_API_KEY` |
| GitHub API | Repo creation | `GITHUB_TOKEN` |
| Vercel API | Auto-deploy previews | `VERCEL_TOKEN` |

---

## Project Structure

```
calverda-prospect-engine/
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                          # Dashboard
│   │   ├── api/
│   │   │   ├── generate/route.ts             # POST: kicks off full pipeline
│   │   │   ├── prospects/route.ts            # GET: list prospects
│   │   │   └── prospects/[id]/route.ts       # GET/PATCH: single prospect
│   │   ├── prospect/[slug]/page.tsx          # Internal: view results
│   │   └── report/[slug]/page.tsx            # Public: competitive intel report
│   │
│   ├── lib/
│   │   ├── pipeline/
│   │   │   ├── index.ts                      # Orchestrator
│   │   │   ├── scraper.ts                    # Phase 1
│   │   │   ├── analyzer.ts                   # Phase 2
│   │   │   ├── builder.ts                    # Phase 3 — Claude Code orchestration
│   │   │   ├── report-generator.ts           # Intel report builder
│   │   │   └── types.ts                      # All interfaces
│   │   │
│   │   ├── config/
│   │   │   └── industries.ts                 # Industry configs
│   │   │
│   │   ├── prompts/
│   │   │   ├── analysis.ts                   # Prompts for Phase 2 analysis
│   │   │   ├── build-brief.ts                # Master prompt builder for Claude Code
│   │   │   └── report.ts                     # Prompts for intel report narrative
│   │   │
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   └── index.ts
│   │   │
│   │   └── utils/
│   │       ├── crawler.ts                    # Website content crawler
│   │       ├── github.ts                     # GitHub repo creation
│   │       ├── vercel.ts                     # Vercel deployment trigger
│   │       └── format.ts                     # Formatting helpers
│   │
│   └── components/
│       ├── ProspectForm.tsx
│       ├── ProspectCard.tsx
│       ├── PipelineStatus.tsx
│       └── IntelReport.tsx                   # React component for PDF report
│
└── output/                                   # Local output cache (gitignored)
```

---

## Phase 1: Data Collection (`scraper.ts`)

All scrapers run in parallel via `Promise.all`.

### 1A: Website Crawler (`utils/crawler.ts`)

This is the most important scraper. It extracts everything from their current site that Claude needs to build the replacement.

```typescript
interface CrawledSite {
  url: string;
  pages: CrawledPage[];
  brandInfo: {
    businessName: string;
    tagline: string | null;
    primaryColor: string | null;       // extracted from CSS
    logoUrl: string | null;
    favicon: string | null;
  };
  contactInfo: {
    phone: string | null;
    email: string | null;
    address: string | null;
    hours: string | null;
  };
  services: ExtractedService[];
  aboutContent: string | null;
  testimonials: string[];
  images: { url: string; alt: string; context: string }[];
  techStack: string[];                  // detected frameworks/CMS
  seoMeta: {
    title: string;
    description: string;
    ogImage: string | null;
    schema: any | null;
  };
}

interface CrawledPage {
  url: string;
  title: string;
  headings: string[];
  bodyText: string;                     // cleaned text content
  wordCount: number;
  internalLinks: string[];
  externalLinks: string[];
}

interface ExtractedService {
  name: string;
  description: string;
  pageUrl: string | null;
}
```

**Implementation approach:**

1. Fetch the homepage HTML
2. Parse with a DOM parser (cheerio or jsdom)
3. Extract: `<title>`, meta description, OG tags, schema markup
4. Extract navigation links — these reveal site structure and service pages
5. Follow internal links (max depth 2, max 20 pages) and extract content from each
6. From all pages, identify:
   - **Services**: Look for pages/sections with service-related headings. Extract service names + descriptions.
   - **About content**: Look for /about page or "About" section
   - **Contact info**: Look for phone (regex for phone patterns), email (mailto links), address (schema or common patterns)
   - **Testimonials**: Look for review/testimonial sections
   - **Images**: Collect all images with their alt text and surrounding context
7. Extract brand colors from inline styles or linked CSS (look for primary color in header/nav/buttons)
8. Detect tech stack from meta tags, script sources, response headers

**Keep the crawler focused.** Don't try to be Screaming Frog. We need enough to understand their business and build something better. Limit to 20 pages, timeout at 30 seconds total.

### 1B: Google Business Profile (`scraper.ts`)

Same as previous spec:
1. Google Places API `findplacefromtext` → get `place_id`
2. Google Places API `details` → get all fields
3. Structure into `GBPData` with completeness score

### 1C: Competitor Scanner (`scraper.ts`)

1. SerpAPI Google Maps search for `"${industry} ${location}"`
2. Take top 5 results (excluding the prospect if found)
3. For each competitor, collect: name, rating, review count, website, address
4. For the top competitor, also crawl their homepage to understand their content strategy

```typescript
interface CompetitorProfile {
  name: string;
  rating: number;
  reviewCount: number;
  website: string | null;
  address: string;
  mapPackPosition: number;
  // From homepage crawl of top competitor only:
  homepageWordCount: number | null;
  serviceCount: number | null;
  hasSchema: boolean | null;
  hasBlog: boolean | null;
}
```

### 1D: Technical Audit

Google PageSpeed Insights API (free, no key):
- Performance score (0-100)
- SEO score (0-100)
- Accessibility score (0-100)
- Core Web Vitals
- Mobile readiness
- Specific failing audits

### 1E: Traffic Estimation

SerpAPI `site:domain` query for indexed page count.
Rough estimate: `indexedPages × 3` monthly visits, `× $2.50` traffic value.
(Replace with SEMrush API later for real numbers.)

---

## Phase 2: Analysis + Brief Generation (`analyzer.ts`)

This phase makes **three Claude API calls** in parallel.

### 2A: Business Analysis + Copy Generation

**Prompt strategy:** Feed Claude ALL the crawled content from their site plus their GBP data. Ask it to deeply understand the business and generate everything needed for the new site.

```typescript
// src/lib/prompts/analysis.ts

export function buildAnalysisPrompt(crawledSite: CrawledSite, gbp: GBPData, industry: IndustryConfig): string {
  return `You are an expert local business analyst and conversion copywriter. 
I've crawled a ${industry.name} business's website and Google Business Profile. 
Analyze everything and generate the complete content for a new, high-converting website.

## THEIR CURRENT WEBSITE CONTENT
URL: ${crawledSite.url}
${crawledSite.pages.map(p => `### ${p.title}\n${p.bodyText.slice(0, 2000)}`).join("\n\n")}

## THEIR GOOGLE BUSINESS PROFILE
Name: ${gbp.name}
Rating: ${gbp.rating} (${gbp.reviewCount} reviews)
Phone: ${gbp.phone}
Address: ${gbp.address}
Hours: ${gbp.hours.join(", ")}
Categories: ${gbp.categories.join(", ")}

## THEIR REVIEWS (sample)
${gbp.reviews.map(r => `${r.rating}★ "${r.text}"`).join("\n")}

## THEIR CURRENT SERVICES (extracted)
${crawledSite.services.map(s => `- ${s.name}: ${s.description}`).join("\n")}

## THEIR ABOUT CONTENT
${crawledSite.aboutContent || "None found"}

## THEIR CONTACT INFO
Phone: ${crawledSite.contactInfo.phone}
Email: ${crawledSite.contactInfo.email}
Address: ${crawledSite.contactInfo.address}

---

Based on ALL of this, generate the following as a JSON object:

{
  "businessSummary": "2-3 sentence summary of what this business does and who they serve",
  "differentiators": ["list of 3-4 things that make them unique, extracted from their content and reviews"],
  "brandVoice": "brief description of their brand voice/tone based on their content",
  
  "siteSections": {
    "hero": {
      "headline": "compelling H1 with city name",
      "subheadline": "2-3 sentence supporting copy",
      "ctaPrimary": "primary button text",
      "ctaSecondary": "secondary button text"
    },
    "services": [
      {
        "name": "service name",
        "headline": "short service headline",
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
        "title": "short benefit title",
        "description": "1-2 sentence explanation"
      }
    ],
    "serviceArea": {
      "headline": "section headline",
      "description": "paragraph about their coverage area",
      "towns": ["list of towns they likely serve based on their address"]
    },
    "cta": {
      "headline": "compelling closing headline",
      "description": "urgency-building paragraph",
      "buttonText": "CTA button text"
    },
    "footer": {
      "description": "2-sentence business description"
    }
  },
  
  "seo": {
    "title": "SEO page title (under 60 chars)",
    "description": "meta description (under 160 chars)",
    "h1": "main H1 tag",
    "keywords": ["8-10 target keywords for this business"]
  },

  "designNotes": {
    "suggestedPrimaryColor": "hex color that fits their brand",
    "suggestedAccentColor": "hex color for CTAs",
    "tone": "warm|professional|modern|traditional|premium|friendly",
    "layoutStyle": "description of recommended layout approach"
  }
}

Be specific to THIS business. Use their actual services, their actual location, 
their actual differentiators. Don't be generic. The copy should feel like it was 
written by someone who deeply understands their business.

Return ONLY valid JSON.`;
}
```

Model: `claude-sonnet-4-20250514`. Max tokens: 4000.

### 2B: Competitive Intelligence

```typescript
export function buildIntelPrompt(
  prospect: { gbp: GBPData; traffic: TrafficData; audit: WebsiteAudit },
  competitors: CompetitorProfile[], 
  industry: IndustryConfig,
  location: string
): string {
  return `You are a local market analyst. Generate a competitive intelligence 
briefing for a ${industry.name} business in ${location}.

## THE PROSPECT
Name: ${prospect.gbp.name}
Rating: ${prospect.gbp.rating} (${prospect.gbp.reviewCount} reviews)
Est. monthly traffic: ${prospect.traffic.estimatedMonthlyTraffic}
Website performance: ${prospect.audit.scores.performance}/100
SEO score: ${prospect.audit.scores.seo}/100
Mobile ready: ${prospect.audit.mobileReady}

## TOP COMPETITORS IN THEIR MARKET
${competitors.map((c, i) => `${i + 1}. ${c.name} — ${c.rating}★ (${c.reviewCount} reviews) — Map Pack #${c.mapPackPosition}`).join("\n")}

## INDUSTRY BENCHMARKS
Avg conversion rate: ${industry.conversionRate * 100}%
Avg close rate: ${industry.closeRate * 100}%
Avg service ticket: $${industry.avgTicket.service}
Avg install ticket: $${industry.avgTicket.install}

Generate a JSON report:
{
  "marketSnapshot": "2-3 sentence overview of the competitive landscape",
  "mapPackAnalysis": "who owns the top 3 spots and the primary reason why",
  "prospectPosition": "where the prospect sits relative to competitors and what's holding them back",
  "keyFindings": [
    "3-5 specific, data-backed findings — e.g. 'You have 12 reviews vs the #1 competitor's 247'"
  ],
  "revenueOpportunity": {
    "monthlyLow": number,
    "monthlyHigh": number,
    "annualLow": number,
    "annualHigh": number,
    "methodology": "1-sentence explanation of how this was calculated"
  },
  "topRecommendations": [
    "3 specific, actionable recommendations in priority order"
  ],
  "urgencyNote": "1 sentence about why acting now matters (e.g. competitor gaining reviews fast)"
}

Return ONLY valid JSON.`;
}
```

Model: `claude-sonnet-4-20250514`. Max tokens: 2000.

### 2C: Build Brief Generation

This is the master prompt that will drive the actual website build. It combines everything from 2A and the raw data into a comprehensive instruction set.

```typescript
export function buildBriefPrompt(
  analysis: BusinessAnalysis,
  crawledSite: CrawledSite,
  gbp: GBPData,
  industry: IndustryConfig
): string {
  return `You are a senior web developer and designer. Build a complete, 
production-quality Next.js website for this local business.

## BUSINESS CONTEXT
${JSON.stringify(analysis, null, 2)}

## THEIR CURRENT BRANDING
Primary color: ${crawledSite.brandInfo.primaryColor || analysis.designNotes.suggestedPrimaryColor}
Logo: ${crawledSite.brandInfo.logoUrl || "Generate text-based logo"}

## CONTACT INFO
Phone: ${gbp.phone}
Address: ${gbp.address}
Hours: ${gbp.hours.join(", ")}
Email: ${crawledSite.contactInfo.email || "info@" + crawledSite.url}

## REAL REVIEWS TO FEATURE
${gbp.reviews.filter(r => r.rating >= 4).slice(0, 5).map(r => 
  `"${r.text}" — ${r.author}`
).join("\n")}

## BUILD REQUIREMENTS

### Technical
- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS
- Single page site (all sections on one page with smooth scroll navigation)
- Mobile-first responsive design
- Optimized for Core Web Vitals (fast loading, no layout shift)
- Self-contained — no external API calls, no database, purely static

### SEO (Critical)
- Proper meta title and description
- Open Graph tags
- LocalBusiness schema markup (JSON-LD) with real business data
- Semantic HTML (proper heading hierarchy, landmarks)
- Image alt text
- Sitemap
- robots.txt

### Design
- Professional, high-quality design — NOT generic template aesthetic
- Color scheme based on: ${analysis.designNotes.suggestedPrimaryColor} primary, ${analysis.designNotes.suggestedAccentColor} accent
- Tone: ${analysis.designNotes.tone}
- Google Fonts — pick distinctive, readable fonts appropriate for the tone
- Subtle animations (fade-in on scroll, hover states)
- Trust signals prominent (reviews, years in business, licensing)

### Sections (in this order)
1. Sticky nav with logo, section links, phone CTA button
2. Hero with headline, description, dual CTAs, trust stats card
3. Trust bar (licensed, insured, warranty, hours)
4. Services grid (all services from analysis)
5. About / Why Choose Us section
6. Reviews / testimonials
7. Service area with town list
8. Final CTA with phone number
9. Footer with contact info, service links, area links

### Every CTA must be a tel: link to ${gbp.phone}
This is a local service business. Phone calls are the conversion.

### Content
Use ALL the copy from the analysis. Do not make up new copy. 
The analysis contains the exact headlines, descriptions, service 
details, and CTAs to use. They were written specifically for this business.

Build the complete project. Every file. Ready to deploy.`;
}
```

This prompt goes to Claude Code for execution.

---

## Phase 3: Build + Deploy (`builder.ts`)

### Option A: Claude Code via CLI (Recommended for V1)

Shell out to Claude Code as a subprocess. Pass the build brief as a prompt file.

```typescript
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function buildSite(buildBrief: string, slug: string): Promise<BuildResult> {
  const repoName = `${slug}-preview`;
  const workDir = `/tmp/calverda-builds/${repoName}`;
  
  // 1. Create GitHub repo
  await createGitHubRepo(repoName);
  
  // 2. Clone it
  await execAsync(`git clone https://github.com/calverda/${repoName}.git ${workDir}`);
  
  // 3. Write the build brief to a file
  fs.writeFileSync(`${workDir}/BUILD_BRIEF.md`, buildBrief);
  
  // 4. Run Claude Code with the brief
  // Claude Code reads the brief and executes the entire build
  await execAsync(
    `cd ${workDir} && claude-code "Read BUILD_BRIEF.md and build this project exactly as specified. When done, commit all files and push to origin main."`,
    { timeout: 300000 } // 5 min timeout
  );
  
  // 5. Trigger Vercel deployment
  const deployUrl = await triggerVercelDeploy(repoName);
  
  return {
    repoUrl: `https://github.com/calverda/${repoName}`,
    previewUrl: deployUrl,
    slug,
  };
}
```

### Option B: Anthropic API Direct (If Claude Code CLI isn't available)

Use the Claude API to generate all files as a single large response, then write them to disk and deploy.

```typescript
export async function buildSiteViaAPI(buildBrief: string, slug: string): Promise<BuildResult> {
  // Ask Claude to generate the complete project as a JSON file tree
  const prompt = `${buildBrief}
  
  Return the COMPLETE project as a JSON object where keys are file paths 
  and values are file contents. Include every file needed for a working 
  Next.js project. Example:
  {
    "package.json": "{ ... }",
    "src/app/page.tsx": "import ...",
    "src/app/layout.tsx": "...",
    "tailwind.config.ts": "..."
  }
  
  Return ONLY the JSON. No markdown.`;
  
  const response = await callClaude(prompt, { maxTokens: 16000 });
  const fileTree = JSON.parse(response);
  
  // Write all files
  const repoName = `${slug}-preview`;
  const workDir = `/tmp/calverda-builds/${repoName}`;
  
  for (const [filePath, content] of Object.entries(fileTree)) {
    const fullPath = path.join(workDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content as string);
  }
  
  // Init git, push, deploy
  await execAsync(`cd ${workDir} && git init && git add . && git commit -m "Initial build" && git remote add origin ... && git push`);
  const deployUrl = await triggerVercelDeploy(repoName);
  
  return { repoUrl: `...`, previewUrl: deployUrl, slug };
}
```

### GitHub Integration (`utils/github.ts`)

```typescript
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function createGitHubRepo(name: string): Promise<string> {
  const { data } = await octokit.repos.create({
    name,
    org: "calverda",              // or your personal account
    private: true,
    auto_init: true,
    description: `Preview site — auto-generated by Calverda Prospect Engine`,
  });
  return data.clone_url;
}
```

### Vercel Integration (`utils/vercel.ts`)

```typescript
export async function triggerVercelDeploy(repoName: string): Promise<string> {
  // Option 1: If repo is connected to Vercel, push triggers auto-deploy
  // Option 2: Use Vercel API to create a new project and deploy
  
  const res = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: repoName,
      gitSource: {
        type: "github",
        repo: `calverda/${repoName}`,
        ref: "main",
      },
    }),
  });
  
  const data = await res.json();
  return `https://${data.url}`;
}
```

---

## Phase 3B: Competitive Intelligence Report (`report-generator.ts`)

The intel report is a standalone web page at `/report/[slug]` that can also be exported as PDF.

### Report Layout

Single page, clean design. Not a sales pitch — a market briefing.

```
┌──────────────────────────────────────────┐
│  [Industry] Market Intelligence          │
│  [Town], [State] — [Month Year]          │
│                                          │
│  Prepared for: [Business Name]           │
├──────────────────────────────────────────┤
│                                          │
│  MARKET SNAPSHOT                         │
│  [2-3 sentence overview]                 │
│                                          │
├──────────────────────────────────────────┤
│                                          │
│  WHO DOMINATES YOUR MARKET               │
│                                          │
│  ┌────┬──────────┬───────┬─────────┐     │
│  │ #  │ Business │ ★ Rtg │ Reviews │     │
│  ├────┼──────────┼───────┼─────────┤     │
│  │ 1  │ ABC HVAC │ 4.9   │ 247     │     │
│  │ 2  │ XYZ Heat │ 4.7   │ 183     │     │
│  │ 3  │ 123 Cool │ 4.8   │ 156     │     │
│  │ ...│          │       │         │     │
│  │ >> │ YOU      │ 4.2   │ 12      │ <<  │
│  └────┴──────────┴───────┴─────────┘     │
│                                          │
├──────────────────────────────────────────┤
│                                          │
│  KEY FINDINGS                            │
│                                          │
│  → Finding 1 with specific numbers       │
│  → Finding 2 with specific numbers       │
│  → Finding 3 with specific numbers       │
│                                          │
├──────────────────────────────────────────┤
│                                          │
│  REVENUE OPPORTUNITY                     │
│                                          │
│       ┌─────────────────────┐            │
│       │  $X,XXX – $XX,XXX   │            │
│       │  estimated monthly   │            │
│       │  revenue gap         │            │
│       └─────────────────────┘            │
│                                          │
│  [1-sentence methodology]                │
│                                          │
├──────────────────────────────────────────┤
│                                          │
│  WHAT WE'D RECOMMEND                     │
│                                          │
│  1. [Top priority action]                │
│  2. [Second priority]                    │
│  3. [Third priority]                     │
│                                          │
├──────────────────────────────────────────┤
│                                          │
│  We built a preview of what your         │
│  digital presence could look like:       │
│                                          │
│  [preview.calverda.com/business-slug]    │
│                                          │
│  Questions? [phone] | [email]            │
│                                          │
│  — Calverda                              │
└──────────────────────────────────────────┘
```

This page is built as a React component that renders from the stored intel data. It can be screenshotted to PDF via Puppeteer for email attachment.

---

## Database Schema

```typescript
export const prospects = sqliteTable("prospects", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  businessName: text("business_name").notNull(),
  websiteUrl: text("website_url"),
  location: text("location").notNull(),
  industry: text("industry").notNull(),

  // Pipeline status
  status: text("status").notNull().default("pending"),
  // pending → scraping → analyzing → building → deploying → complete → error
  statusMessage: text("status_message"),
  errorMessage: text("error_message"),

  // Phase 1 data (JSON)
  crawledSiteData: text("crawled_site_data"),
  gbpData: text("gbp_data"),
  competitorData: text("competitor_data"),
  auditData: text("audit_data"),
  trafficData: text("traffic_data"),

  // Phase 2 data (JSON)
  businessAnalysis: text("business_analysis"),
  competitiveIntel: text("competitive_intel"),
  buildBrief: text("build_brief"),

  // Phase 3 outputs
  previewUrl: text("preview_url"),
  repoUrl: text("repo_url"),
  revenueGapMonthly: integer("revenue_gap_monthly"),
  revenueGapAnnual: integer("revenue_gap_annual"),

  // Engagement tracking
  reportViewCount: integer("report_view_count").default(0),
  previewViewCount: integer("preview_view_count").default(0),
  lastViewedAt: text("last_viewed_at"),

  // Timestamps
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
});
```

---

## Dashboard UI

### Main Page (`/`)

Clean, focused interface. Not a complex admin panel — a tool for one job.

**Top section**: Large input form
- Business name (text input)
- Website URL (text input) 
- Location (text input, default "Long Island, NY")
- Industry (dropdown: HVAC, Plumbing, Electrical, Landscaping, Dental, Behavioral Health)
- **[ Generate Package ]** button — large, prominent

**Below**: List of previous prospects as cards
- Business name + industry badge
- Status indicator (animated during processing)
- Revenue gap number (when complete)
- Links: View Package | Preview Site | Intel Report
- Timestamp

**During processing**: The card shows a step-by-step progress indicator:
```
✅ Crawling website...
✅ Pulling Google Business Profile...
✅ Scanning competitors...
⏳ Analyzing business...
○  Building website...
○  Deploying preview...
```

### Prospect Detail (`/prospect/[slug]`)

Shows everything for one prospect:
- Status + timestamps
- Quick stats: revenue gap, reviews, rating, GBP score
- Links to: preview site, intel report, GitHub repo
- Full scraped data (collapsible)
- Generated copy (collapsible)
- Build brief (collapsible)

---

## Implementation Priority

Build in this order:

### Sprint 1: Core Pipeline (get it working end-to-end)
1. Project scaffolding (Next.js + Tailwind + Drizzle)
2. Website crawler (`utils/crawler.ts`)
3. GBP scraper + competitor scanner (`scraper.ts`)
4. PageSpeed audit integration
5. Analysis prompts + Claude API integration (`analyzer.ts`)
6. Build brief generation (`prompts/build-brief.ts`)
7. Site builder — start with Option B (API-generated file tree)
8. Basic dashboard UI (form + prospect list)

### Sprint 2: Polish + Deploy
1. GitHub integration for auto repo creation
2. Vercel integration for auto deployment
3. Competitive intel report page
4. Prospect detail page
5. Pipeline status real-time updates
6. Error handling + retry logic

### Sprint 3: Scale
1. Switch to Claude Code CLI for higher quality builds (Option A)
2. Report PDF export
3. Engagement tracking on public pages
4. Batch processing (CSV import of prospects)
5. Email delivery integration

---

## Key Implementation Notes

1. **The website crawler is the foundation.** If the crawler extracts good content, everything downstream is better. Invest time here. Test against real Long Island business websites.

2. **Claude API calls should use `claude-sonnet-4-20250514`** for all analysis. For the actual site build (Option B), use the largest context model available to fit the entire file tree in one response.

3. **Always have fallbacks.** If the crawler finds no services, use industry defaults. If Claude API fails, use template copy. If GBP isn't found, use manual input data. The pipeline should never completely fail.

4. **The build brief is the most important prompt in the system.** It determines the quality of the final website. Iterate on this prompt constantly. Test it against real businesses and refine.

5. **Keep preview sites simple.** Single-page, static, no dynamic data. They need to load fast and look good. Don't over-engineer them.

6. **Phone number is the only CTA.** Every button on the generated site should be `tel:` link. No contact forms, no chat widgets. Local service businesses convert via phone calls.

7. **The competitive intel report is the hook, the website is the close.** The report makes them feel the pain. The website shows them the solution already exists. Together they're almost impossible to ignore.
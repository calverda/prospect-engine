import * as cheerio from "cheerio";
import type {
  CrawledSite,
  CrawledPage,
  ExtractedService,
} from "@/lib/pipeline/types";

const MAX_PAGES = 20;
const MAX_DEPTH = 2;
const CRAWL_TIMEOUT_MS = 30_000;
const PAGE_TIMEOUT_MS = 8_000;
const JINA_TIMEOUT_MS = 15_000;
const THIN_CONTENT_THRESHOLD = 500; // chars — below this we suspect JS rendering
const USER_AGENT =
  "Mozilla/5.0 (compatible; CalverdaBot/1.0; +https://calverda.com)";

// ── Public API ──

export async function crawlWebsite(url: string): Promise<CrawledSite> {
  const baseUrl = normalizeBaseUrl(url);
  const origin = new URL(baseUrl).origin;

  const visited = new Set<string>();
  const pages: CrawledPage[] = [];
  const queue: { url: string; depth: number }[] = [{ url: baseUrl, depth: 0 }];

  const crawlStart = Date.now();

  // BFS crawl with depth + page + time limits
  while (queue.length > 0 && pages.length < MAX_PAGES) {
    if (Date.now() - crawlStart > CRAWL_TIMEOUT_MS) break;

    const next = queue.shift()!;
    const canonical = canonicalize(next.url);

    if (visited.has(canonical)) continue;
    visited.add(canonical);

    // Skip non-HTML resources
    if (shouldSkipUrl(canonical)) continue;

    const page = await fetchAndParsePage(canonical).catch(() => null);
    if (!page) continue;

    pages.push(page);

    // Queue internal links for deeper crawling
    if (next.depth < MAX_DEPTH) {
      for (const link of page.internalLinks) {
        const resolved = resolveUrl(link, origin);
        if (resolved && !visited.has(canonicalize(resolved))) {
          queue.push({ url: resolved, depth: next.depth + 1 });
        }
      }
    }
  }

  // If we got zero pages, try JS-rendering fallback before giving up
  if (pages.length === 0) {
    const jsPage = await fetchWithJsRendering(baseUrl);
    if (jsPage) {
      console.log(`[crawler] Static fetch returned 0 pages, JS rendering recovered content (${jsPage.bodyText.length} chars)`);
      pages.push(jsPage);
    } else {
      return emptyResult(baseUrl);
    }
  }

  // Check if content is thin — likely a JS-rendered site
  const totalBodyText = pages.reduce((sum, p) => sum + p.bodyText.length, 0);
  if (totalBodyText < THIN_CONTENT_THRESHOLD && pages.length > 0) {
    console.log(`[crawler] Thin content detected (${totalBodyText} chars across ${pages.length} pages) — trying JS rendering fallback...`);
    const jsPage = await fetchWithJsRendering(baseUrl);
    if (jsPage && jsPage.bodyText.length > totalBodyText) {
      console.log(`[crawler] JS rendering recovered ${jsPage.bodyText.length} chars (was ${totalBodyText})`);
      // Replace the thin homepage with the JS-rendered version
      pages[0] = jsPage;

      // Also try to re-fetch a few key internal pages via JS rendering
      const internalUrls = jsPage.internalLinks
        .filter((link) => {
          const path = new URL(link, origin).pathname.toLowerCase();
          return /service|about|contact/i.test(path);
        })
        .slice(0, 4);

      const jsSubPages = await Promise.allSettled(
        internalUrls.map((url) => fetchWithJsRendering(url))
      );
      for (const result of jsSubPages) {
        if (result.status === "fulfilled" && result.value && result.value.bodyText.length > 100) {
          // Replace or add the page
          const existingIdx = pages.findIndex((p) => canonicalize(p.url) === canonicalize(result.value!.url));
          if (existingIdx >= 0) {
            pages[existingIdx] = result.value;
          } else {
            pages.push(result.value);
          }
        }
      }
    }
  }

  const homepage = pages[0];
  const homepageHtml = await fetchHtml(baseUrl).catch(() => null);
  const $ = homepageHtml ? cheerio.load(homepageHtml.html) : null;

  // Extract structured data from all crawled pages
  const services = extractServices(pages);
  const aboutContent = extractAboutContent(pages);
  const contactInfo = extractContactInfo(pages);
  const testimonials = extractTestimonials(pages);
  const images = extractImages(pages, origin);

  // Homepage-specific extractions (need raw HTML)
  const seoMeta = $ ? extractSeoMeta($, baseUrl) : defaultSeoMeta(homepage);
  const brandInfo = $ ? extractBrandInfo($, baseUrl, homepageHtml?.headers) : defaultBrandInfo(homepage);
  const techStack = $ ? detectTechStack($, homepageHtml?.headers) : [];
  const hours = extractHours(pages);

  return {
    url: baseUrl,
    pages,
    brandInfo,
    contactInfo: {
      phone: contactInfo.phone,
      email: contactInfo.email,
      address: contactInfo.address,
      hours,
    },
    services,
    aboutContent,
    testimonials,
    images,
    techStack,
    seoMeta,
  };
}

// ── Fetching ──

interface FetchResult {
  html: string;
  headers: Record<string, string>;
}

async function fetchHtml(url: string): Promise<FetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
      throw new Error(`Not HTML: ${contentType}`);
    }

    const html = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      headers[k] = v;
    });

    return { html, headers };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAndParsePage(url: string): Promise<CrawledPage> {
  const { html } = await fetchHtml(url);
  return parsePage(url, html);
}

// ── JS rendering fallback (Jina Reader API) ──

async function fetchWithJsRendering(url: string): Promise<CrawledPage | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), JINA_TIMEOUT_MS);

    const jinaUrl = `https://r.jina.ai/${url}`;
    console.log(`[crawler] Fetching via Jina Reader: ${url}`);

    const res = await fetch(jinaUrl, {
      headers: {
        Accept: "text/markdown",
        "X-Return-Format": "markdown",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[crawler] Jina Reader returned ${res.status} for ${url}`);
      return null;
    }

    const markdown = await res.text();
    if (!markdown || markdown.length < 50) {
      console.warn(`[crawler] Jina Reader returned minimal content for ${url}`);
      return null;
    }

    // Parse the markdown into a CrawledPage
    return parseJinaMarkdown(url, markdown);
  } catch (err) {
    console.warn(`[crawler] Jina Reader failed for ${url}: ${err}`);
    return null;
  }
}

function parseJinaMarkdown(url: string, markdown: string): CrawledPage {
  // Extract title from first heading
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Extract all headings
  const headings: string[] = [];
  const headingRegex = /^#{1,4}\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const text = match[1].trim();
    if (text && text.length < 150) headings.push(text);
  }

  // Strip markdown formatting for body text
  const bodyText = markdown
    .replace(/^#{1,6}\s+/gm, "") // Remove heading markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) → text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "") // Remove images
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1") // bold/italic → plain
    .replace(/`[^`]+`/g, "") // Remove inline code
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/^\s*[-*+]\s+/gm, "") // Remove list markers
    .replace(/^\s*\d+\.\s+/gm, "") // Remove numbered list markers
    .replace(/\n{3,}/g, "\n\n") // Collapse multiple newlines
    .replace(/\s+/g, " ")
    .trim();

  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  // Extract links
  const origin = new URL(url).origin;
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  while ((match = linkRegex.exec(markdown)) !== null) {
    const href = match[2];
    const resolved = resolveUrl(href, origin);
    if (!resolved) continue;
    if (resolved.startsWith(origin)) {
      internalLinks.push(resolved);
    } else {
      externalLinks.push(resolved);
    }
  }

  return {
    url,
    title,
    headings,
    bodyText: bodyText.slice(0, 10_000),
    wordCount,
    internalLinks: [...new Set(internalLinks)],
    externalLinks: [...new Set(externalLinks)],
  };
}

// ── Page parsing ──

function parsePage(url: string, html: string): CrawledPage {
  const $ = cheerio.load(html);

  // Remove noise — strip nav, footer, header menus, scripts, styles
  $("script, style, noscript, iframe, svg").remove();
  $("nav, header nav, footer nav, [role='navigation']").remove();

  const title = $("title").first().text().trim();

  const headings: string[] = [];
  $("h1, h2, h3, h4").each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 150) headings.push(text);
  });

  // Also strip headers and footers for cleaner body text
  const $content = $("main, article, [role='main'], .content, #content").first();
  const textSource = $content.length ? $content : $("body");

  // Remove skip links and cookie banners from text source
  textSource.find("[class*='skip'], [class*='cookie'], [class*='banner']").remove();

  const bodyText = textSource
    .text()
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  const origin = new URL(url).origin;
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const resolved = resolveUrl(href, origin);
    if (!resolved) return;

    if (resolved.startsWith(origin)) {
      internalLinks.push(resolved);
    } else {
      externalLinks.push(resolved);
    }
  });

  return {
    url,
    title,
    headings,
    bodyText: bodyText.slice(0, 10_000), // cap at 10k chars per page
    wordCount,
    internalLinks: [...new Set(internalLinks)],
    externalLinks: [...new Set(externalLinks)],
  };
}

// ── SEO meta extraction ──

function extractSeoMeta(
  $: cheerio.CheerioAPI,
  baseUrl: string
): CrawledSite["seoMeta"] {
  const title = $("title").first().text().trim();
  const description =
    $('meta[name="description"]').attr("content")?.trim() ?? "";
  const ogImage =
    $('meta[property="og:image"]').attr("content") ?? null;

  // Look for JSON-LD schema
  let schema: unknown | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html() ?? "");
      // Prefer LocalBusiness or Organization schema
      if (!schema || parsed["@type"]?.includes("Business")) {
        schema = parsed;
      }
    } catch {
      // skip malformed JSON-LD
    }
  });

  return { title, description, ogImage, schema };
}

function defaultSeoMeta(homepage: CrawledPage): CrawledSite["seoMeta"] {
  return {
    title: homepage.title,
    description: "",
    ogImage: null,
    schema: null,
  };
}

// ── Brand info extraction ──

function extractBrandInfo(
  $: cheerio.CheerioAPI,
  baseUrl: string,
  headers?: Record<string, string>
): CrawledSite["brandInfo"] {
  // Business name: first try OG title, then <title> cleaned up
  const ogTitle = $('meta[property="og:site_name"]').attr("content")?.trim();
  const rawTitle = $("title").first().text().trim();
  const businessName =
    ogTitle ?? rawTitle.split(/[|\-–—]/)[0].trim() ?? rawTitle;

  // Tagline: look for the first h2 or p directly in the hero/header area
  const tagline =
    $("header h2, header p, .hero p, .hero h2, [class*='hero'] p")
      .first()
      .text()
      .trim() || null;

  // Logo: look for img in header/nav, or link[rel=icon]
  let logoUrl =
    $("header img, nav img, .logo img, [class*='logo'] img")
      .first()
      .attr("src") ?? null;
  if (logoUrl) logoUrl = resolveUrl(logoUrl, new URL(baseUrl).origin) ?? logoUrl;

  // Favicon
  let favicon =
    $('link[rel="icon"], link[rel="shortcut icon"]').first().attr("href") ??
    null;
  if (favicon) favicon = resolveUrl(favicon, new URL(baseUrl).origin) ?? favicon;

  // Primary color: extract from CSS custom properties or inline styles on
  // header/nav/buttons — look for common patterns
  const primaryColor = extractPrimaryColor($);

  return { businessName, tagline, primaryColor, logoUrl, favicon };
}

function defaultBrandInfo(homepage: CrawledPage): CrawledSite["brandInfo"] {
  const businessName = homepage.title.split(/[|\-–—]/)[0].trim();
  return {
    businessName,
    tagline: null,
    primaryColor: null,
    logoUrl: null,
    favicon: null,
  };
}

function extractPrimaryColor($: cheerio.CheerioAPI): string | null {
  // Strategy 1: look for CSS custom property --primary or --brand
  const styleSheets: string[] = [];
  $("style").each((_, el) => {
    styleSheets.push($(el).html() ?? "");
  });
  const allCss = styleSheets.join("\n");

  const cssVarMatch = allCss.match(
    /--(?:primary|brand|main|accent)[-\w]*\s*:\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\))/
  );
  if (cssVarMatch) return cssVarMatch[1];

  // Strategy 2: extract background-color from header, nav, or primary buttons
  const targets = [
    "header",
    "nav",
    ".navbar",
    '[class*="header"]',
    'a[class*="btn-primary"]',
    'button[class*="primary"]',
    '[class*="cta"]',
  ];

  for (const selector of targets) {
    const style = $(selector).first().attr("style");
    if (style) {
      const bgMatch = style.match(
        /background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\))/
      );
      if (bgMatch) return bgMatch[1];
    }
  }

  // Strategy 3: look for hex colors in CSS targeting common elements
  const headerBgMatch = allCss.match(
    /(?:header|nav|\.navbar|\.nav)\s*\{[^}]*background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,8})/
  );
  if (headerBgMatch) return headerBgMatch[1];

  return null;
}

// ── Tech stack detection ──

function detectTechStack(
  $: cheerio.CheerioAPI,
  headers?: Record<string, string>
): string[] {
  const stack: Set<string> = new Set();

  // Meta generator tag
  const generator = $('meta[name="generator"]').attr("content") ?? "";
  if (generator) {
    if (/wordpress/i.test(generator)) stack.add("WordPress");
    else if (/wix/i.test(generator)) stack.add("Wix");
    else if (/squarespace/i.test(generator)) stack.add("Squarespace");
    else if (/drupal/i.test(generator)) stack.add("Drupal");
    else if (/joomla/i.test(generator)) stack.add("Joomla");
    else if (/shopify/i.test(generator)) stack.add("Shopify");
    else stack.add(generator.split(/\s/)[0]);
  }

  // Script sources
  const scriptSrcs: string[] = [];
  $("script[src]").each((_, el) => {
    scriptSrcs.push($(el).attr("src") ?? "");
  });
  const allScripts = scriptSrcs.join(" ");

  if (/wp-content|wp-includes/i.test(allScripts)) stack.add("WordPress");
  if (/jquery/i.test(allScripts)) stack.add("jQuery");
  if (/react/i.test(allScripts)) stack.add("React");
  if (/angular/i.test(allScripts)) stack.add("Angular");
  if (/vue/i.test(allScripts)) stack.add("Vue");
  if (/next/i.test(allScripts) || $('script[id="__NEXT_DATA__"]').length)
    stack.add("Next.js");
  if (/gatsby/i.test(allScripts)) stack.add("Gatsby");
  if (/wix\.com/i.test(allScripts)) stack.add("Wix");
  if (/squarespace/i.test(allScripts)) stack.add("Squarespace");
  if (/shopify/i.test(allScripts)) stack.add("Shopify");
  if (/webflow/i.test(allScripts)) stack.add("Webflow");
  if (/godaddy/i.test(allScripts)) stack.add("GoDaddy");
  if (/google.*tag.*manager|gtm\.js/i.test(allScripts))
    stack.add("Google Tag Manager");
  if (/google.*analytics|ga\.js|gtag/i.test(allScripts))
    stack.add("Google Analytics");

  // Response headers
  if (headers) {
    const server = headers["server"] ?? headers["x-powered-by"] ?? "";
    if (/nginx/i.test(server)) stack.add("Nginx");
    if (/apache/i.test(server)) stack.add("Apache");
    if (/cloudflare/i.test(server)) stack.add("Cloudflare");
    if (headers["x-shopify-stage"]) stack.add("Shopify");
    if (headers["x-wix-request-id"]) stack.add("Wix");
  }

  // HTML hints
  if ($("[data-reactroot], [data-reactid]").length) stack.add("React");
  if ($("[ng-app], [ng-controller]").length) stack.add("Angular");
  if ($("[data-v-], [v-cloak]").length) stack.add("Vue");

  return [...stack];
}

// ── Service extraction ──

const SERVICE_SECTION_KEYWORDS =
  /service|what we (?:do|offer)|our work|capabilities|solutions|treatments|specialties/i;

// Headings that are clearly not service names
const NON_SERVICE_PATTERNS =
  /^(contact|about|blog|article|news|faq|frequently|how (?:do|can|much|to)|why |what (?:is|are|our)|get (?:your|a|an)|learn more|check out|resources|our process|testimonial|review|copyright|follow us|call us)/i;

const MAX_SERVICES = 12;

export function extractServices(pages: CrawledPage[]): ExtractedService[] {
  const services: ExtractedService[] = [];
  const seen = new Set<string>();

  // Prioritize pages with service-related URLs
  const sortedPages = [...pages].sort((a, b) => {
    const aScore = /service|what-we-do|our-work|solution|treatment|specialt/i.test(a.url) ? 0 : 1;
    const bScore = /service|what-we-do|our-work|solution|treatment|specialt/i.test(b.url) ? 0 : 1;
    return aScore - bScore;
  });

  for (const page of sortedPages) {
    if (services.length >= MAX_SERVICES) break;

    const urlLower = page.url.toLowerCase();
    const isServicePage =
      /service|what-we-do|our-work|solution|treatment|specialt/i.test(urlLower);

    // Skip blog/article pages entirely
    if (/blog|article|news|press|post/i.test(urlLower)) continue;

    for (let i = 0; i < page.headings.length; i++) {
      if (services.length >= MAX_SERVICES) break;

      const heading = page.headings[i];
      const name = heading.trim();
      const nameLower = name.toLowerCase();

      // Skip section headers themselves
      if (SERVICE_SECTION_KEYWORDS.test(name) && name.split(/\s+/).length <= 5)
        continue;

      // Skip non-service headings (blogs, FAQs, CTAs, etc.)
      if (NON_SERVICE_PATTERNS.test(name)) continue;

      // Skip headings that are too long (likely sentences/paragraphs not service names)
      if (name.length < 3 || name.length > 60) continue;
      if (name.split(/\s+/).length > 8) continue;

      // Must be on a service page or under a service section heading
      const isUnderServiceSection =
        isServicePage ||
        (i > 0 && SERVICE_SECTION_KEYWORDS.test(page.headings[i - 1]));

      if (!isUnderServiceSection) continue;

      if (seen.has(nameLower)) continue;
      seen.add(nameLower);

      const desc = findDescriptionNearHeading(page.bodyText, name);

      services.push({
        name,
        description: desc,
        pageUrl: page.url,
      });
    }
  }

  return services;
}

function findDescriptionNearHeading(bodyText: string, heading: string): string {
  const idx = bodyText.indexOf(heading);
  if (idx === -1) return "";

  // Grab text after the heading, skip the heading itself
  let afterHeading = bodyText
    .slice(idx + heading.length, idx + heading.length + 500)
    .trim();

  // Clean up concatenated heading text that bleeds in (e.g. "sentence. NextHeadingMore text")
  // Split at points where a lowercase letter/period is immediately followed by an uppercase letter
  afterHeading = afterHeading.replace(/([a-z.!?])([A-Z][a-z])/g, "$1 $2");

  // Take the first 1-2 complete sentences
  const sentences = afterHeading.match(/[^.!?]+[.!?]+/g);
  if (sentences && sentences.length > 0) {
    const desc = sentences.slice(0, 2).join(" ").trim();
    return desc.length > 200 ? desc.slice(0, 200).trim() + "..." : desc;
  }
  return afterHeading.slice(0, 150).trim();
}

// ── About content extraction ──

function extractAboutContent(pages: CrawledPage[]): string | null {
  // Prefer a dedicated /about page
  const aboutPage = pages.find((p) =>
    /about|who-we-are|our-story|our-team/i.test(p.url)
  );

  if (aboutPage) {
    // Strip leading nav/skip-link text by finding the first real sentence
    let text = aboutPage.bodyText;
    const firstSentence = text.search(/[A-Z][a-z].*?[.!?]\s/);
    if (firstSentence > 0 && firstSentence < 200) {
      text = text.slice(firstSentence);
    }
    return text.slice(0, 3000);
  }

  // Fall back to "About" section on homepage
  const homepage = pages[0];
  if (!homepage) return null;

  const aboutIdx = homepage.bodyText.search(
    /about us|who we are|our story|our mission/i
  );
  if (aboutIdx !== -1) {
    return homepage.bodyText.slice(aboutIdx, aboutIdx + 1500).trim();
  }

  return null;
}

// ── Contact info extraction ──

export function extractContactInfo(pages: CrawledPage[]): {
  phone: string | null;
  email: string | null;
  address: string | null;
} {
  const allText = pages.map((p) => p.bodyText).join(" ");

  // Phone: US formats (xxx) xxx-xxxx, xxx-xxx-xxxx, xxx.xxx.xxxx, +1...
  const phoneMatch = allText.match(
    /(?:\+1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/
  );
  const phone = phoneMatch ? phoneMatch[0].trim() : null;

  // Email: look for mailto links first, then regex
  let email: string | null = null;
  for (const page of pages) {
    // Check external links for mailto
    for (const link of page.externalLinks) {
      if (link.startsWith("mailto:")) {
        email = link.replace("mailto:", "").split("?")[0];
        break;
      }
    }
    if (email) break;
  }
  if (!email) {
    const emailMatch = allText.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );
    email = emailMatch ? emailMatch[0] : null;
  }

  // Address: look for common US address patterns (number + street + city/state/zip)
  const addressMatch = allText.match(
    /\d{1,5}\s+[\w\s.]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)\.?,?\s+[\w\s]+,?\s*[A-Z]{2}\s*\d{5}/i
  );
  const address = addressMatch ? addressMatch[0].trim() : null;

  return { phone, email, address };
}

// ── Testimonial extraction ──

function extractTestimonials(pages: CrawledPage[]): string[] {
  const testimonials: string[] = [];

  for (const page of pages) {
    const text = page.bodyText;

    // Look for quoted text near review/testimonial keywords
    const reviewSection = text.search(
      /testimonial|review|what (?:our )?(?:clients|customers|patients) say|hear from/i
    );
    if (reviewSection === -1) continue;

    const sectionText = text.slice(reviewSection, reviewSection + 3000);

    // Extract quoted strings (both curly and straight quotes)
    const quotes = sectionText.match(
      /[""\u201C]([^""\u201D]{30,500})[""\u201D]/g
    );
    if (quotes) {
      for (const q of quotes.slice(0, 5)) {
        const cleaned = q.replace(/^[""\u201C]|[""\u201D]$/g, "").trim();
        if (cleaned.length > 30) {
          testimonials.push(cleaned);
        }
      }
    }
  }

  return testimonials;
}

// ── Hours extraction ──

function extractHours(pages: CrawledPage[]): string | null {
  const allText = pages.map((p) => p.bodyText).join(" ");

  // Look for patterns like "Mon-Fri 8am-5pm" or "Monday through Friday"
  const hoursMatch = allText.match(
    /(?:Mon(?:day)?|hours)[^.]{0,200}(?:\d{1,2}\s*(?:am|pm|AM|PM))/i
  );

  return hoursMatch ? hoursMatch[0].trim().slice(0, 200) : null;
}

// ── Image extraction ──

function extractImages(
  pages: CrawledPage[],
  origin: string
): CrawledSite["images"] {
  // We need to re-parse HTML for images since CrawledPage doesn't store them.
  // For now, return empty — images will be populated during the full crawl
  // when we have access to the raw HTML via cheerio.
  // TODO: Store image data during parsePage and aggregate here.
  return [];
}

// ── URL utilities ──

function normalizeBaseUrl(url: string): string {
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = "https://" + normalized;
  }
  // Remove trailing slash for consistency
  return normalized.replace(/\/+$/, "");
}

function resolveUrl(href: string, origin: string): string | null {
  try {
    // Skip anchors, javascript:, tel:, mailto:
    if (/^(#|javascript:|tel:|mailto:|data:|blob:)/i.test(href.trim())) {
      // But capture mailto: for contact extraction
      if (href.trim().startsWith("mailto:")) return href.trim();
      return null;
    }
    const resolved = new URL(href, origin).href;
    // Strip hash fragments
    return resolved.split("#")[0];
  } catch {
    return null;
  }
}

function canonicalize(url: string): string {
  try {
    const u = new URL(url);
    // Normalize: lowercase host, strip trailing slash, strip common tracking params
    let path = u.pathname.replace(/\/+$/, "") || "/";
    return `${u.origin}${path}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function shouldSkipUrl(url: string): boolean {
  const lower = url.toLowerCase();
  // Skip assets, documents, media
  return /\.(pdf|jpg|jpeg|png|gif|svg|webp|mp4|mp3|zip|doc|docx|xls|xlsx|css|js|xml|json|ico|woff|woff2|ttf|eot)(\?|$)/i.test(
    lower
  );
}

function emptyResult(url: string): CrawledSite {
  return {
    url,
    pages: [],
    brandInfo: {
      businessName: "",
      tagline: null,
      primaryColor: null,
      logoUrl: null,
      favicon: null,
    },
    contactInfo: { phone: null, email: null, address: null, hours: null },
    services: [],
    aboutContent: null,
    testimonials: [],
    images: [],
    techStack: [],
    seoMeta: { title: "", description: "", ogImage: null, schema: null },
  };
}

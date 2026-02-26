import { collectAllData } from "./scraper";
import { analyzeAll } from "./analyzer";
import { buildSite } from "./builder";
import type { ProspectInput, PipelineResult } from "./types";

export async function runPipeline(input: ProspectInput): Promise<PipelineResult> {
  console.log("\n" + "=".repeat(60));
  console.log("  CALVERDA PROSPECT ENGINE");
  console.log(`  Target: ${input.businessName}`);
  console.log(`  Location: ${input.location}`);
  console.log(`  Industry: ${input.industry}`);
  console.log("=".repeat(60));

  const startTime = Date.now();

  // Phase 1: Scrape — website crawl, GBP, competitors, audit, traffic in parallel
  const scraped = await collectAllData(input);

  // Phase 2: Analyze — business analysis, competitive intel, build brief via Claude
  const { analysis, intel, buildBrief } = await analyzeAll(scraped, input);

  // Phase 3: Build — create repo, build site via Claude Code, deploy to Vercel
  const slug = input.businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const build = await buildSite(analysis, scraped, input, slug);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("\n" + "=".repeat(60));
  console.log(`  COMPLETE in ${elapsed}s`);
  console.log(`  Preview: ${build.previewUrl}`);
  console.log(`  Repo: ${build.repoUrl}`);
  console.log("=".repeat(60) + "\n");

  return { slug, scraped, analysis, intel, build };
}

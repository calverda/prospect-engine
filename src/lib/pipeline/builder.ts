import type {
  ProspectInput,
  ScrapedData,
  BusinessAnalysis,
  BuildResult,
} from "./types";
import { createGitHubRepo } from "@/lib/utils/github";
import { triggerVercelDeploy } from "@/lib/utils/vercel";

export async function buildSite(
  analysis: BusinessAnalysis,
  scraped: ScrapedData,
  input: ProspectInput,
  slug: string
): Promise<BuildResult> {
  // TODO: Implementation options:
  // Option A: Shell out to Claude Code CLI with the build brief
  // Option B: Use Claude API to generate file tree, write to disk, push to GitHub
  throw new Error("Not implemented: buildSite");
}

export async function buildSiteViaAPI(
  buildBrief: string,
  slug: string
): Promise<BuildResult> {
  // TODO: Claude API generates complete project as JSON file tree
  throw new Error("Not implemented: buildSiteViaAPI");
}

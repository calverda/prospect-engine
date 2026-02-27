import type { BuildResult } from "./types";
import {
  createRepoFromTemplate,
  pushFileToRepo,
} from "@/lib/utils/github";
import {
  createVercelProject,
  triggerVercelDeploy,
  waitForDeployment,
} from "@/lib/utils/vercel";

/**
 * Build a prospect preview site:
 * 1. Create GitHub repo from template
 * 2. Push the content.json with prospect-specific data
 * 3. Deploy to Vercel
 * 4. Return URLs
 */
export async function buildSite(
  sitePlanJson: string,
  slug: string
): Promise<BuildResult> {
  const repoName = `preview-${slug}`;

  console.log(`[builder] Creating repo from template: ${repoName}`);

  // Step 1: Create repo from template
  const { repoUrl, owner } = await createRepoFromTemplate(repoName);
  console.log(`[builder] Repo created: ${repoUrl}`);

  // Step 2: Push content.json — retries internally until template repo is ready
  console.log("[builder] Pushing content.json...");
  await pushFileToRepo(
    owner,
    repoName,
    "data/content.json",
    sitePlanJson,
    "Update content.json with prospect data"
  );

  // Step 4: Create Vercel project and deploy
  console.log("[builder] Creating Vercel project...");
  try {
    await createVercelProject(repoName, owner, repoName);
  } catch (err) {
    // Project might already exist if retrying
    console.log(`[builder] Project creation note: ${err}`);
  }

  console.log("[builder] Triggering Vercel deployment...");
  const deployUrl = await triggerVercelDeploy(repoName);
  console.log(`[builder] Deployment started: ${deployUrl}`);

  // Step 5: Wait for deployment to finish
  console.log("[builder] Waiting for deployment to complete...");
  const previewUrl = await waitForDeployment(
    deployUrl.replace("https://", "")
  );

  console.log(`[builder] Deployed: ${previewUrl}`);

  return {
    repoUrl,
    previewUrl,
    slug,
  };
}

const VERCEL_API = "https://api.vercel.com";

function getHeaders() {
  if (!process.env.VERCEL_TOKEN) {
    throw new Error("VERCEL_TOKEN is not set");
  }
  return {
    Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  };
}

/** Create a new Vercel project connected to a GitHub repo */
export async function createVercelProject(
  projectName: string,
  repoOwner: string,
  repoName: string
): Promise<string> {
  const res = await fetch(`${VERCEL_API}/v10/projects`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name: projectName,
      framework: "nextjs",
      gitRepository: {
        type: "github",
        repo: `${repoOwner}/${repoName}`,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vercel project creation failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  return data.id;
}

/** Trigger a deployment for a Vercel project from its connected GitHub repo */
export async function triggerVercelDeploy(repoName: string): Promise<string> {
  const res = await fetch(`${VERCEL_API}/v13/deployments`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name: repoName,
      gitSource: {
        type: "github",
        repo: `calverda/${repoName}`,
        ref: "main",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vercel deploy failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  return `https://${data.url}`;
}

/** Wait for a Vercel deployment to finish and return the production URL */
export async function waitForDeployment(
  deploymentUrl: string,
  maxWaitMs = 180000
): Promise<string> {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(
      `${VERCEL_API}/v13/deployments/${encodeURIComponent(deploymentUrl)}`,
      { headers: getHeaders() }
    );

    if (res.ok) {
      const data = await res.json();
      if (data.readyState === "READY") {
        const alias = data.alias?.[0];
        return alias ? `https://${alias}` : `https://${data.url}`;
      }
      if (data.readyState === "ERROR") {
        throw new Error(`Deployment failed: ${data.errorMessage || "Unknown error"}`);
      }
    }

    await new Promise((r) => setTimeout(r, 5000));
  }

  throw new Error(`Deployment not ready after ${maxWaitMs / 1000}s`);
}

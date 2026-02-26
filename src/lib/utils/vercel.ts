export async function triggerVercelDeploy(repoName: string): Promise<string> {
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
        repo: repoName,
        ref: "main",
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Vercel deploy failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return `https://${data.url}`;
}

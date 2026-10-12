import {
  assertSafeDocument,
  ingestKnowledgeDocument,
} from "../services/knowledge-ingestion.service.js";
import { PORTFOLIO_KNOWLEDGE } from "../services/portfolio-knowledge.js";

async function fetchReadme(repoUrl: string): Promise<string | null> {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;

  const owner = match[1];
  const repo = match[2];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    for (const branch of ["main", "master"]) {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;
      const response = await fetch(rawUrl, { signal: controller.signal });
      if (response.ok) return await response.text();
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function ingest(): Promise<void> {
  console.log("Starting explicit RAG ingestion for approved portfolio GitHub READMEs...");
  let blocked = 0;

  for (const project of PORTFOLIO_KNOWLEDGE.projects) {
    if (!project.url.includes("github.com")) {
      console.log(`SKIPPED: ${project.title} has no approved GitHub URL.`);
      continue;
    }

    const readmeContent = await fetchReadme(project.url);
    if (!readmeContent) {
      blocked++;
      console.error(`BLOCKED: README unavailable for ${project.title}.`);
      continue;
    }

    assertSafeDocument(project.url, readmeContent);
    const result = await ingestKnowledgeDocument({
      title: `${project.title} README`,
      sourceType: "URL",
      sourceUri: project.url,
      mimeType: "text/markdown",
      visibility: "PUBLIC",
      text: readmeContent,
      metadata: {
        parser: "github-raw-readme",
        approval: "portfolio-knowledge-source-of-truth",
        sourceUrl: project.url,
      },
    });
    console.log(`${result.status}: ${project.title} (${result.chunks} chunks)`);
  }

  console.log("Portfolio ingestion complete. No local reports/datasets were scanned.");
  if (blocked > 0) process.exitCode = 2;
}

ingest().catch((error) => {
  console.error(`Portfolio ingestion failed: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});

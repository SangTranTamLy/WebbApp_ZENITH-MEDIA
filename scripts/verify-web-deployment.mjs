import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".map",
  ".svg",
  ".txt",
]);

const forbiddenPatterns = [
  {
    label: "local development API URL",
    pattern: /https?:\/\/(?:localhost:(?:4000|5173)|127\.0\.0\.1:(?:4000|5173)|\[::1\](?::(?:4000|5173))?)(?:\/|["<\s]|$)/iu,
  },
  {
    label: "Supabase server secret",
    pattern: /SUPABASE_SECRET_KEY|SUPABASE_SERVICE_ROLE_KEY/iu,
  },
  {
    label: "cookie secret",
    pattern: /COOKIE_SECRET/iu,
  },
  {
    label: "AI provider secret",
    pattern: /OPENAI_API_KEY|ANTHROPIC_API_KEY|GOOGLE_GENERATIVE_AI_API_KEY/iu,
  },
];

const distDirectory = path.resolve(
  process.cwd(),
  process.argv[2] ?? "dist",
);

async function collectTextFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectTextFiles(entryPath));
      continue;
    }

    if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(entryPath);
    }
  }

  return files;
}

const directoryInfo = await stat(distDirectory).catch(() => null);

if (!directoryInfo?.isDirectory()) {
  console.error(`Web deployment verification failed: missing ${distDirectory}`);
  process.exit(1);
}

const violations = [];

for (const filePath of await collectTextFiles(distDirectory)) {
  const contents = await readFile(filePath, "utf8");

  for (const forbidden of forbiddenPatterns) {
    if (forbidden.pattern.test(contents)) {
      violations.push({
        filePath,
        label: forbidden.label,
      });
    }
  }
}

if (violations.length > 0) {
  console.error("Web deployment verification failed:");

  for (const violation of violations) {
    console.error(`- ${violation.label}: ${violation.filePath}`);
  }

  process.exit(1);
}

console.log(`Web deployment verification passed: ${distDirectory}`);

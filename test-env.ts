import path from "node:path";
import { homedir } from "node:os";
import { readFile } from "node:fs/promises";

async function loadEnvFile(p: string): Promise<Record<string, string>> {
  try {
    const content = await readFile(p, "utf8");
    const env: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
    return env;
  } catch {
    return {};
  }
}

async function loadEnv(): Promise<void> {
  const home = homedir();
  const cwd = process.cwd();

  const homeEnv = await loadEnvFile(path.join(home, ".baoyu-skills", ".env"));
  const cwdEnv = await loadEnvFile(path.join(cwd, ".baoyu-skills", ".env"));

  console.log("Home env path:", path.join(home, ".baoyu-skills", ".env"));
  console.log("Home env:", homeEnv);
  console.log("Cwd env path:", path.join(cwd, ".baoyu-skills", ".env"));
  console.log("Cwd env:", cwdEnv);

  for (const [k, v] of Object.entries(homeEnv)) {
    if (!process.env[k]) process.env[k] = v;
  }
  for (const [k, v] of Object.entries(cwdEnv)) {
    if (!process.env[k]) process.env[k] = v;
  }

  console.log("DASHSCOPE_API_KEY:", process.env.DASHSCOPE_API_KEY ? 'SET' : 'NOT SET');
  console.log("DASHSCOPE_IMAGE_MODEL:", process.env.DASHSCOPE_IMAGE_MODEL || 'default');
}

await loadEnv();

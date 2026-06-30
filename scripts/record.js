#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { loadConfig, repoFullName } = require("../src/config");
const { createClient } = require("../src/github");

// --- Cache helpers (same pattern) ---

function cacheDir(config) {
  const hash = crypto.createHash("sha1").update(repoFullName(config)).digest("hex").slice(0, 12);
  return path.join(process.env.AUTOMEMHUB_CACHE_DIR || path.join(os.homedir(), ".cache", "AutoMemHub"), hash);
}

function cachePaths(config) {
  const dir = cacheDir(config);
  return { root: dir, files: path.join(dir, "files") };
}

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

// --- Build memory entry ---

function buildEntry(title, tags, content) {
  const now = new Date().toISOString().split("T")[0];
  const tagList = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const frontmatter = [
    "---",
    `title: "${title}"`,
    `created: "${now}"`,
    `tags: [${tagList.map((t) => `"${t}"`).join(", ")}]`,
    "---",
  ].join("\n");
  return `${frontmatter}\n\n${content.trim()}\n`;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const positional = [];
  let title = null, tags = null, content = null, profile = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--title" && args[i + 1]) title = args[++i];
    else if (arg === "--tags" && args[i + 1]) tags = args[++i];
    else if (arg === "--content" && args[i + 1]) content = args[++i];
    else if (arg.startsWith("--profile=")) profile = arg.split("=")[1];
    else if (!arg.startsWith("--")) positional.push(arg);
  }

  const category = positional[0];
  if (!category || !title || !content) {
    console.log(JSON.stringify({
      error: "Usage: record.js <category/path> --title 'Title' --content 'Content' [--tags t1,t2]",
    }));
    process.exit(1);
  }

  const config = loadConfig({ profile });
  const remotePath = `${config.profile}/${category}/${slugify(title)}.md`;
  const body = buildEntry(title, tags, content);

  // Write to local cache
  const paths = cachePaths(config);
  const localPath = path.join(paths.files, remotePath);
  ensureDir(path.dirname(localPath));
  fs.writeFileSync(localPath, body);

  // Push to GitHub
  let pushResult = null;
  try {
    const client = createClient(config);
    let existingSha = null;
    try { const existing = await client.getFile(remotePath); if (existing) existingSha = existing.sha; } catch (e) { /* new file */ }
    await client.putFile(remotePath, body, existingSha, `Add memory: ${title}`);
    pushResult = { ok: true, path: remotePath };
  } catch (e) {
    pushResult = { ok: false, error: e.message };
  }

  console.log(JSON.stringify({
    ok: true,
    path: remotePath,
    title,
    profile: config.profile,
    push: pushResult,
  }, null, 2));
}

main().catch((e) => {
  console.error(JSON.stringify({ error: e.message }));
  process.exit(1);
});

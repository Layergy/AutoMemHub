#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { loadConfig, repoFullName } = require("../src/config");
const { createClient } = require("../src/github");

// --- Cache helpers ---

function cacheDir(config) {
  const hash = crypto.createHash("sha1").update(repoFullName(config)).digest("hex").slice(0, 12);
  return path.join(process.env.AUTOMEMHUB_CACHE_DIR || path.join(os.homedir(), ".cache", "AutoMemHub"), hash);
}

function cachePaths(config) {
  const dir = cacheDir(config);
  return { root: dir, files: path.join(dir, "files"), state: path.join(dir, "state.json") };
}

function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }

function readState(config) {
  const p = cachePaths(config);
  if (!fs.existsSync(p.state)) return { last_synced_at: null };
  return JSON.parse(fs.readFileSync(p.state, "utf8"));
}

function writeState(config, state) {
  const p = cachePaths(config);
  ensureDir(path.dirname(p.state));
  fs.writeFileSync(p.state, JSON.stringify(state, null, 2) + "\n");
}

function isStale(config) {
  const state = readState(config);
  if (!state.last_synced_at) return true;
  return Date.now() - Date.parse(state.last_synced_at) > config.cacheTtlMs;
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walkDir(full));
    if (e.isFile()) files.push(full);
  }
  return files;
}

// --- Pull from GitHub ---

async function pull(config) {
  const client = createClient(config);
  const paths = cachePaths(config);
  ensureDir(paths.files);

  const tree = await client.getTree();
  const mdFiles = tree.filter((p) => p.endsWith(".md") && !p.endsWith("/context.md"));

  let count = 0;
  for (const remotePath of mdFiles) {
    try {
      const file = await client.getFile(remotePath);
      if (file) {
        const local = path.join(paths.files, remotePath);
        ensureDir(path.dirname(local));
        fs.writeFileSync(local, file.content);
        count++;
      }
    } catch (e) { /* skip */ }
  }

  writeState(config, { last_synced_at: new Date().toISOString(), file_count: count });
  return count;
}

// --- Search ---

function searchFiles(config, query, profile) {
  const paths = cachePaths(config);
  const searchDirs = [
    path.join(paths.files, "shared"),
    path.join(paths.files, profile),
  ].filter((d) => fs.existsSync(d));

  const results = [];
  const queryLower = query.toLowerCase();

  for (const dir of searchDirs) {
    const files = walkDir(dir).filter((f) => f.endsWith(".md") && !f.endsWith("/context.md"));
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      const rel = path.relative(paths.files, file);
      const score = scoreFile(content, queryLower);
      if (score > 0) {
        results.push({ path: rel, score, snippet: extractSnippet(content, query, 150) });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 10);
}

function scoreFile(content, queryLower) {
  let score = 0;
  const lower = content.toLowerCase();
  const titleMatch = content.match(/^---\n[\s\S]*?title:\s*"?([^"\n]+)"?/m);
  if (titleMatch && titleMatch[1].toLowerCase().includes(queryLower)) score += 10;
  const tagsMatch = content.match(/^---\n[\s\S]*?tags:\s*\[([^\]]+)\]/m);
  if (tagsMatch) {
    const tags = tagsMatch[1].toLowerCase();
    for (const word of queryLower.split(/\s+/)) {
      if (word.length > 1 && tags.includes(word)) score += 5;
    }
  }
  if (lower.includes(queryLower)) {
    score += 3;
    score += Math.min(lower.split(queryLower).length - 1, 5);
  }
  return score;
}

function extractSnippet(content, query, maxLen) {
  const lines = content.split("\n").filter((l) => l.trim());
  let start = 0;
  if (lines[0] === "---") {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === "---") { start = i + 1; break; }
    }
  }
  const body = lines.slice(start).join("\n");
  const idx = body.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return body.slice(0, maxLen) + (body.length > maxLen ? "..." : "");
  const s = Math.max(0, idx - 40);
  const e = Math.min(body.length, idx + query.length + maxLen);
  let snippet = body.slice(s, e);
  if (s > 0) snippet = "..." + snippet;
  if (e < body.length) snippet += "...";
  return snippet;
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const query = args.filter((a) => !a.startsWith("--")).join(" ");
  const profileArg = args.find((a) => a.startsWith("--profile="));

  if (!query) {
    console.log(JSON.stringify({ error: "Usage: recall.js <query> [--profile=name]" }));
    process.exit(1);
  }

  const profile = profileArg ? profileArg.split("=")[1] : null;
  const config = loadConfig({ profile });

  if (isStale(config)) {
    try { await pull(config); } catch (e) { /* continue with cache */ }
  }

  const results = searchFiles(config, query, config.profile);
  console.log(JSON.stringify({
    query,
    profile: config.profile,
    result_count: results.length,
    sync_status: isStale(config) ? "stale" : "fresh",
    results,
  }, null, 2));
}

main().catch((e) => {
  console.error(JSON.stringify({ error: e.message }));
  process.exit(1);
});

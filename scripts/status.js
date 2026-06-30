#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { loadConfig, repoFullName } = require("../src/config");

function cacheDir(config) {
  const hash = crypto.createHash("sha1").update(repoFullName(config)).digest("hex").slice(0, 12);
  return path.join(process.env.AUTOMEMHUB_CACHE_DIR || path.join(os.homedir(), ".cache", "AutoMemHub"), hash);
}

function readState(config) {
  const stateFile = path.join(cacheDir(config), "state.json");
  if (!fs.existsSync(stateFile)) return { last_synced_at: null };
  return JSON.parse(fs.readFileSync(stateFile, "utf8"));
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) count += countFiles(full);
    if (e.isFile() && e.name.endsWith(".md")) count++;
  }
  return count;
}

function main() {
  const args = process.argv.slice(2);
  const profileArg = args.find((a) => a.startsWith("--profile="));
  const profile = profileArg ? profileArg.split("=")[1] : null;

  const config = loadConfig({ profile });
  const cacheBase = cacheDir(config);
  const filesDir = path.join(cacheBase, "files");
  const state = readState(config);

  const synced = state.last_synced_at ? new Date(state.last_synced_at) : null;
  const ageMs = synced ? Date.now() - synced.getTime() : Infinity;
  const ageMin = Math.round(ageMs / 60000);
  let syncStatus = "never";
  if (synced) syncStatus = ageMin < 5 ? "fresh" : ageMin < 60 ? "stale" : "very-stale";

  console.log(JSON.stringify({
    repo: repoFullName(config),
    branch: config.repo.branch,
    profile: config.profile,
    token_present: Boolean(config.token),
    cache_dir: cacheBase,
    cached_files: countFiles(filesDir),
    last_synced: state.last_synced_at || null,
    sync_status: syncStatus,
    age_minutes: ageMin,
  }, null, 2));
}

main();

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

function findConfigPath(explicitPath) {
  const candidates = [
    explicitPath,
    process.env.AUTOMEMHUB_CONFIG,
    path.join(process.cwd(), "automemhub.config.json"),
    path.join(os.homedir(), ".config", "AutoMemHub", "config.json"),
  ].filter(Boolean);
  return candidates.find((c) => fs.existsSync(c)) || null;
}

function loadConfig({ configPath, profile } = {}) {
  const resolved = findConfigPath(configPath);
  const file = resolved ? JSON.parse(fs.readFileSync(resolved, "utf8")) : {};

  const repo = file.repo || null;
  if (!repo || !repo.owner || !repo.name) {
    throw new Error("repo.owner and repo.name are required in config");
  }

  const tokenEnv = file.tokenEnv || "GITHUB_TOKEN";
  const token = process.env[tokenEnv] || "";
  if (!token) {
    throw new Error(`Missing env var ${tokenEnv}. Set it in .env or export it.`);
  }

  const profileName = profile || file.defaultProfile || "default";

  return {
    repo: {
      owner: String(repo.owner).trim(),
      name: String(repo.name).trim(),
      branch: String(repo.branch || "main").trim(),
    },
    token,
    profile: profileName,
    cacheTtlMs: Number(file.cacheTtlSeconds || 300) * 1000,
    configPath: resolved,
  };
}

function repoFullName(config) {
  return `${config.repo.owner}/${config.repo.name}`;
}

module.exports = { loadConfig, repoFullName };

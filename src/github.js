"use strict";

const { repoFullName } = require("./config");

class GitHubClient {
  constructor(config) {
    this.repo = config.repo;
    this.token = config.token;
    this.base = `https://api.github.com/repos/${repoFullName(config)}`;
  }

  async request(method, urlPath, body) {
    const res = await fetch(`${this.base}${urlPath}`, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "User-Agent": "AutoMemHub",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (res.status === 204) return null;
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const err = new Error(data?.message || `GitHub ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  async getTree() {
    const data = await this.request(
      "GET",
      `/git/trees/${encodeURIComponent(this.repo.branch)}?recursive=1`
    );
    return (data.tree || [])
      .filter((t) => t.type === "blob")
      .map((t) => t.path);
  }

  async getFile(filePath) {
    const encoded = filePath.split("/").map(encodeURIComponent).join("/");
    const data = await this.request(
      "GET",
      `/contents/${encoded}?ref=${encodeURIComponent(this.repo.branch)}`
    );
    if (data.type !== "file") return null;
    return {
      path: filePath,
      content: Buffer.from(data.content || "", "base64").toString("utf8"),
      sha: data.sha,
    };
  }

  async putFile(filePath, content, sha, message) {
    const encoded = filePath.split("/").map(encodeURIComponent).join("/");
    const body = {
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      branch: this.repo.branch,
    };
    if (sha) body.sha = sha;
    return this.request("PUT", `/contents/${encoded}`, body);
  }
}

function createClient(config) {
  return new GitHubClient(config);
}

module.exports = { createClient };

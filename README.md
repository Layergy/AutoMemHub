# AutoMemHub

GitHub-backed AI memory with hierarchical tree structure.

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/Layergy/AutoMemHub.git
cd AutoMemHub
bash install.sh

# 2. Use
node ~/.agents/skills/AutoMemHub/scripts/recall.js "topic"
node ~/.agents/skills/AutoMemHub/scripts/record.js "category" --title "Title" --content "Content"
node ~/.agents/skills/AutoMemHub/scripts/status.js
```

## What It Does

- **Recall**: Search your memory before starting work
- **Record**: Save decisions, learnings, patterns after work
- **Sync**: GitHub is the source of truth, local cache for speed

## Setup

1. Create a private GitHub repo (e.g., `memory-tree`)
2. Run `bash install.sh` — it will:
   - Check Node.js ≥ 18
   - Install to `~/.agents/skills/AutoMemHub/`
   - Create config at `~/.config/AutoMemHub/config.json`
   - Prompt for repo and token
3. Add directories to your repo: `shared/`, `default/`, etc.

## Tree Structure

```
memory-tree/
├── shared/           # Human-maintained, all profiles can read
│   ├── context.md
│   └── architecture.md
├── default/          # Agent profile (read/write)
│   ├── projects/
│   │   └── hermes/
│   └── preferences/
└── work/             # Another agent profile (read/write)
    └── projects/
```

**Read/write rules:**

| Profile | Can read | Can write |
|---------|----------|-----------|
| default | `default/` + `shared/` | `default/` only |
| work | `work/` + `shared/` | `work/` only |
| human | `shared/` + any profile | `shared/` directly |

**About `shared/`:**

The `shared/` directory is maintained by you (the human), not by agents. Use it for information all profiles need to know:

- Project architecture and conventions
- Team-wide decisions and standards
- Reference material that doesn't belong to any single profile

Edit `shared/` directly on GitHub or via git. Agents read it but don't write to it — this prevents conflicting edits from multiple profiles.

## Usage

### Recall (before work)

```bash
node ~/.agents/skills/AutoMemHub/scripts/recall.js "checkpoint bug"
node ~/.agents/skills/AutoMemHub/scripts/recall.js "coding style" --profile=default
```

### Record (after work)

```bash
node ~/.agents/skills/AutoMemHub/scripts/record.js "projects/hermes" \
  --title "Gateway checkpoint bug" \
  --content "Gateway doesn't pass checkpoints_enabled." \
  --tags "hermes,bug"
```

### Status

```bash
node ~/.agents/skills/AutoMemHub/scripts/status.js
```

## Config

Config file: `~/.config/AutoMemHub/config.json`

```json
{
  "repo": {
    "owner": "your-username",
    "name": "memory-tree",
    "branch": "main"
  },
  "tokenEnv": "GITHUB_TOKEN",
  "defaultProfile": "default",
  "cacheTtlSeconds": 300
}
```

## Uninstall

```bash
bash ~/.agents/skills/AutoMemHub/uninstall.sh
```

Removes skill files, config, and cache. Does not delete your GitHub repo.

## License

MIT

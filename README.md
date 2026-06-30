# AutoMemHub

GitHub-backed AI memory with hierarchical tree structure.

## Quick Start

```bash
# 1. Install
bash install.sh

# 2. Use
node scripts/recall.js "topic"
node scripts/record.js "category" --title "Title" --content "Content"
node scripts/status.js
```

## What It Does

- **Recall**: Search your memory before starting work
- **Record**: Save decisions, learnings, patterns after work
- **Sync**: GitHub is the source of truth, local cache for speed

## Setup

1. Create a private GitHub repo (e.g., `memory-tree`)
2. Run `bash install.sh` — it will:
   - Check Node.js ≥ 18
   - Create config at `~/.config/AutoMemHub/config.json`
   - Prompt for repo and token
3. Add directories to your repo: `shared/`, `default/`, etc.

## Tree Structure

```
memory-tree/
├── shared/           # All profiles can read
├── default/          # Your default profile
│   ├── projects/
│   └── preferences/
└── work/             # Work profile
```

## Usage

### Recall (before work)

```bash
node scripts/recall.js "checkpoint bug"
node scripts/recall.js "coding style" --profile=default
```

### Record (after work)

```bash
node scripts/record.js "projects/hermes" \
  --title "Gateway checkpoint bug" \
  --content "Gateway doesn't pass checkpoints_enabled." \
  --tags "hermes,bug"
```

### Status

```bash
node scripts/status.js
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
bash uninstall.sh
```

Removes skill files, config, and cache. Does not delete your GitHub repo.

## License

MIT

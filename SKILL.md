---
name: AutoMemHub
description: "Use when: recalling project knowledge before tasks, recording decisions after work, or managing persistent memory via GitHub. GitHub-backed memory with hierarchical tree structure."
version: 0.3.0
author: Layergy
license: MIT
metadata:
  hermes:
    tags: [memory, github, knowledge, persistence]
    related_skills: [memory-dreaming]
---

# AutoMemHub — GitHub-Backed Memory

## Overview

Persistent memory system using GitHub as backend. Organized as a hierarchical tree where each level has a `context.md` describing its scope. Profiles are top-level directories — each profile reads its own + shared/, writes only to its own.

**Core discipline:** Query before you think. Curate after you implement.

## When to Use

- Starting a non-trivial task → **recall** what's already known
- Finishing something worth remembering → **record** the learning
- Memory may be stale → **check status**

**Don't use for:**
- Session-scoped notes (use Hermes memory tool)
- Temporary scratch (use todo tool)
- Secrets, API keys, passwords

## Prerequisites

- Node.js ≥ 18
- GitHub personal access token with `repo` scope
- A private GitHub repo for memory storage

## Setup

Run the installer from the cloned repo:

```bash
git clone https://github.com/Layergy/AutoMemHub.git
cd AutoMemHub
bash install.sh
```

This will:
1. Check Node.js version
2. Install skill to `~/.agents/skills/AutoMemHub/`
3. Create config at `~/.config/AutoMemHub/config.json`
4. Prompt for GitHub repo and token

## Tree Structure

```
memory-tree/
├── shared/                   # All profiles can read, nobody writes directly
│   ├── context.md            # Describes shared knowledge scope
│   └── architecture.md
├── default/                  # Default profile (read/write)
│   ├── context.md
│   ├── projects/             # Topic: projects
│   │   └── hermes/
│   │   ├── context.md        # Describes hermes topic scope
│   │   └── checkpoint-bug.md # Knowledge entry
│   └── preferences/          # Topic: preferences
│       ├── context.md
│       └── coding-style.md
└── work/                     # Work profile (read/write)
    ├── context.md
    └── projects/
        └── api/
            └── auth-decisions.md
```

**Read/write rules:**

| Profile | Can read | Can write |
|---------|----------|-----------|
| default | `default/` + `shared/` | `default/` only |
| work | `work/` + `shared/` | `work/` only |

Each `context.md` describes the node's purpose and scope. Knowledge entries are standalone markdown files.

## Usage

### Recall — Before Work

```bash
node ~/.agents/skills/AutoMemHub/scripts/recall.js "topic or question"
```

Read results before proceeding. If `sync_status` is `stale` or `never`, mention uncertainty.

### Record — After Work

```bash
node ~/.agents/skills/AutoMemHub/scripts/record.js "projects/hermes" \
  --title "Short title" \
  --content "What was learned or decided" \
  --tags "tag1,tag2"
```

### Status

```bash
node ~/.agents/skills/AutoMemHub/scripts/status.js
```

## Memory Entry Format

```markdown
---
title: "Gateway checkpoint bug"
created: "2026-06-30"
tags: [hermes, bug, gateway]
---

## Problem
Gateway doesn't pass checkpoints_enabled to AIAgent.

## Resolution
Known bug, issue #11409, waiting for upstream fix.
```

## Rules

- Record only durable information likely to help future tasks
- Do not record secrets, API keys, passwords, or sensitive personal data
- Prefer newer memories when older ones are superseded
- Organize by topic: `projects/hermes`, `preferences/coding`, `learnings/deployment`

## Common Pitfalls

1. **Forgetting to sync.** If `sync_status` is `stale`, run recall with `--sync` first
2. **Recording transient info.** If it won't matter next week, don't record it
3. **Wrong profile directory.** Check `--profile` flag matches your intended namespace

## Verification Checklist

- [ ] `node ~/.agents/skills/AutoMemHub/scripts/status.js` shows `token_present: true`
- [ ] `node ~/.agents/skills/AutoMemHub/scripts/recall.js "test"` returns results
- [ ] `node ~/.agents/skills/AutoMemHub/scripts/record.js` writes to correct profile

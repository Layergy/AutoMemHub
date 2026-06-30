#!/bin/bash
set -e

SKILL_DIR="$HOME/.agents/skills/AutoMemHub"
CONFIG_DIR="$HOME/.config/AutoMemHub"
CONFIG_FILE="$CONFIG_DIR/config.json"

echo "=== AutoMemHub Installer ==="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found. Install Node.js >= 18 first."
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Node.js >= 18 required. Found: $(node -v)"
    exit 1
fi

echo "✓ Node.js $(node -v)"

# Create skill directory
mkdir -p "$SKILL_DIR"
echo "✓ Skill directory: $SKILL_DIR"

# Copy files
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cp -r "$SCRIPT_DIR/scripts" "$SKILL_DIR/"
cp -r "$SCRIPT_DIR/src" "$SKILL_DIR/"
cp "$SCRIPT_DIR/SKILL.md" "$SKILL_DIR/"
cp "$SCRIPT_DIR/package.json" "$SKILL_DIR/"
cp "$SCRIPT_DIR/automemhub.config.example.json" "$SKILL_DIR/"
echo "✓ Files copied"

# Create config directory
mkdir -p "$CONFIG_DIR"

# Setup config if not exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo ""
    echo "=== Configuration ==="
    echo ""
    read -p "GitHub repo (owner/name): " REPO
    read -p "Branch [main]: " BRANCH
    BRANCH=${BRANCH:-main}
    read -p "Profile [default]: " PROFILE
    PROFILE=${PROFILE:-default}
    read -p "GitHub token env var [GITHUB_TOKEN]: " TOKEN_ENV
    TOKEN_ENV=${TOKEN_ENV:-GITHUB_TOKEN}

    cat > "$CONFIG_FILE" <<EOF
{
  "repo": {
    "owner": "$(echo $REPO | cut -d/ -f1)",
    "name": "$(echo $REPO | cut -d/ -f2)",
    "branch": "$BRANCH"
  },
  "tokenEnv": "$TOKEN_ENV",
  "defaultProfile": "$PROFILE",
  "cacheTtlSeconds": 300
}
EOF
    echo "✓ Config created: $CONFIG_FILE"
else
    echo "✓ Config exists: $CONFIG_FILE"
fi

# Check token
TOKEN_VAR=$(grep -o '"tokenEnv": *"[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
if [ -z "${!TOKEN_VAR}" ]; then
    echo ""
    echo "⚠ Token env var $TOKEN_VAR not set."
    echo "  Add to ~/.hermes/.env or export it:"
    echo "  export $TOKEN_VAR=ghp_..."
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Usage:"
echo "  node $SKILL_DIR/scripts/recall.js \"topic\""
echo "  node $SKILL_DIR/scripts/record.js \"category/path\" --title \"Title\" --content \"Content\""
echo "  node $SKILL_DIR/scripts/status.js"

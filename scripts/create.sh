#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/siraj-samsudeen/feather-starter-convex.git"

if [ $# -lt 1 ]; then
  echo "Usage: bash <(curl -s ...) <project-name>"
  echo ""
  echo "Creates a new project from the Feather Starter template."
  exit 1
fi

PROJECT_DIR="$1"

if [ -d "$PROJECT_DIR" ]; then
  echo "Error: Directory '$PROJECT_DIR' already exists."
  exit 1
fi

echo ""
echo "Creating project '$PROJECT_DIR' from Feather Starter..."
echo ""

# Clone and set up upstream for future updates
git clone "$REPO_URL" "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Set up upstream remote for receiving updates
git remote rename origin upstream
echo "Upstream remote set. Pull updates later with: git pull upstream main"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Run interactive setup (branding + Convex init)
echo ""
npm run setup

echo ""
echo "Setup complete! Starting dev server..."
echo ""
echo "To receive bug fixes and updates later: git pull upstream main"
echo ""

# Start dev server automatically — no cd needed
npm start

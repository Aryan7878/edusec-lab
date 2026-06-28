#!/bin/bash
# ─── EduSec Labs — Oracle Cloud VPS Deployment Script ────────────────────────
# Usage: ./deploy.sh <your-oracle-vm-public-ip>
# Prerequisites on VPS: git, docker, docker compose plugin
# Run once on fresh VPS to install Docker:
#   curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER

set -e

VPS_IP="${1:?Usage: ./deploy.sh <VPS_PUBLIC_IP>}"
VPS_USER="${VPS_USER:-ubuntu}"
REPO_URL="https://github.com/Aryan7878/edusec-lab.git"
APP_DIR="~/edusec-labs"

echo "🚀 Deploying EduSec Labs to ${VPS_USER}@${VPS_IP}..."

ssh "${VPS_USER}@${VPS_IP}" bash -s << REMOTE_SCRIPT
  set -e
  echo "📦 Pulling latest code..."

  if [ ! -d "${APP_DIR}" ]; then
    git clone ${REPO_URL} ${APP_DIR}
  else
    cd ${APP_DIR} && git pull origin Aryan
  fi

  cd ${APP_DIR}

  # Ensure .env exists (copy from example if first deploy)
  if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  .env created from template — EDIT IT before re-running!"
    echo "   SSH in and run: nano ${APP_DIR}/.env"
    exit 1
  fi

  echo "🐳 Building and starting containers..."
  docker compose -f docker-compose.prod.yml pull mongodb
  docker compose -f docker-compose.prod.yml up -d --build

  echo "⏳ Waiting for services to be healthy..."
  sleep 15

  echo "🌱 Seeding labs and challenges (safe to run multiple times)..."
  docker exec edusec-labs-app node scripts/initLabs.js      2>/dev/null || true
  docker exec edusec-labs-app node scripts/initChallenges.js 2>/dev/null || true

  echo "✅ Deployment complete!"
  docker compose -f docker-compose.prod.yml ps
REMOTE_SCRIPT

echo ""
echo "🎉 EduSec Labs is live at: http://${VPS_IP}:5000"
echo "   Set CORS_ORIGIN in .env to your Cloudflare Pages URL, then re-deploy."

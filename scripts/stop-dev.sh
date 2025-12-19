#!/bin/bash

# =============================================================================
# ZeroCost Development Stop Script
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🛑 Stopping ZeroCost Development Environment"
echo "============================================="

# Kill running processes
pkill -f "ranking_server" 2>/dev/null || true
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "zerocost/scraper" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true

# Stop Docker containers
cd "$PROJECT_ROOT/infra"
docker-compose down 2>/dev/null || true

echo "✅ All services stopped"



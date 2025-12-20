#!/bin/bash

# =============================================================================
# ZeroCost Development Startup Script
# =============================================================================
# This script starts all services for local development
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🎯 Starting ZeroCost Development Environment"
echo "============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Docker
echo -e "\n${YELLOW}Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Start infrastructure (Postgres + Redis)
echo -e "\n${YELLOW}Starting infrastructure (Postgres + Redis)...${NC}"
cd "$PROJECT_ROOT/infra"
docker-compose up -d postgres redis

# Wait for Postgres to be ready
echo -e "\n${YELLOW}Waiting for Postgres to be ready...${NC}"
until docker-compose exec -T postgres pg_isready -U zerocost > /dev/null 2>&1; do
    echo "  Waiting..."
    sleep 2
done
echo -e "${GREEN}✅ Postgres is ready${NC}"

# Wait for Redis to be ready
echo -e "\n${YELLOW}Waiting for Redis to be ready...${NC}"
until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    echo "  Waiting..."
    sleep 2
done
echo -e "${GREEN}✅ Redis is ready${NC}"

# Build and start C++ ranking engine
echo -e "\n${YELLOW}Starting C++ Ranking Engine...${NC}"
cd "$PROJECT_ROOT/backend/ranking-engine"
if [ ! -f "build/ranking_server" ]; then
    mkdir -p build && cd build
    cmake .. && make -j4
    cd ..
fi
./build/ranking_server &
RANKING_PID=$!
sleep 2
if curl -s http://localhost:8082/health > /dev/null; then
    echo -e "${GREEN}✅ Ranking Engine running on port 8082${NC}"
else
    echo -e "${RED}❌ Ranking Engine failed to start${NC}"
fi

# Start Java API
echo -e "\n${YELLOW}Starting Java API...${NC}"
cd "$PROJECT_ROOT/backend/java-api"
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev &
JAVA_PID=$!
echo "  Waiting for Java API to start (this may take a minute)..."
sleep 30
if curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Java API running on port 8080${NC}"
else
    echo -e "${YELLOW}⏳ Java API still starting... check logs${NC}"
fi

# Start Go Scraper
echo -e "\n${YELLOW}Starting Go Scraper...${NC}"
cd "$PROJECT_ROOT/backend/go-scraper"
if [ ! -f "scraper" ]; then
    go build -o scraper .
fi
./scraper &
SCRAPER_PID=$!
sleep 2
if curl -s http://localhost:8081/health > /dev/null; then
    echo -e "${GREEN}✅ Go Scraper running on port 8081${NC}"
else
    echo -e "${RED}❌ Go Scraper failed to start${NC}"
fi

# Start Frontend
echo -e "\n${YELLOW}Starting Frontend...${NC}"
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
    npm install
fi
npm run dev &
FRONTEND_PID=$!
sleep 5
echo -e "${GREEN}✅ Frontend running on port 3000${NC}"

echo ""
echo "============================================="
echo -e "${GREEN}🎉 All services started!${NC}"
echo "============================================="
echo ""
echo "Services:"
echo "  📊 Frontend:       http://localhost:3000"
echo "  ☕ Java API:       http://localhost:8080"
echo "  🔍 Go Scraper:     http://localhost:8081"
echo "  ⚡ Ranking Engine: http://localhost:8082"
echo "  🐘 PostgreSQL:     localhost:5432"
echo "  📮 Redis:          localhost:6379"
echo ""
echo "To stop all services: Ctrl+C or run ./scripts/stop-dev.sh"
echo ""

# Trap to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping services...${NC}"
    kill $RANKING_PID $JAVA_PID $SCRAPER_PID $FRONTEND_PID 2>/dev/null || true
    cd "$PROJECT_ROOT/infra"
    docker-compose down
    echo -e "${GREEN}✅ All services stopped${NC}"
}
trap cleanup EXIT

# Wait
wait




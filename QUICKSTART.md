# 🚀 ZeroCost Quick Start Guide

Get ZeroCost running locally in 5 minutes!

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- A Mapbox account (free tier)

## Step 1: Clone and Setup

```bash
git clone <your-repo-url>
cd ZeroCost

# Copy environment variables
cp .env.example .env

# Edit .env with your values
# At minimum, set:
# - POSTGRES_PASSWORD
# - JWT_SECRET
# - NEXT_PUBLIC_MAPBOX_TOKEN
```

## Step 2: Get Mapbox Token

1. Go to https://account.mapbox.com/
2. Sign up for free account
3. Copy your access token
4. Add to `.env`:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
   ```

## Step 3: Start Backend Services

### Option A: Use the Start Script (Recommended)

```bash
./scripts/start-dev.sh
```

This automatically starts all services and waits for them to be ready.

### Option B: Manual Docker Compose

```bash
cd infra
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- C++ Ranking Engine (port 8082)
- Java API (port 8080)
- Go Scraper (port 8081)

Wait 30 seconds for services to initialize.

## Step 4: Verify Backend

```bash
# Check all services are healthy
docker-compose ps

# Test API
curl http://localhost:8080/actuator/health

# Test Ranking Engine
curl http://localhost:8082/health

# Test Scraper
curl http://localhost:8081/health
```

## Step 5: Start Frontend

```bash
cd ../frontend
npm install
cp .env.local.example .env.local

# Edit .env.local with your Mapbox token
# NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

npm run dev
```

## Step 6: Open App

Open http://localhost:3000 in your browser!

You should see:
- Interactive map
- "Getting your location..." message
- Event list sidebar
- Search and filter bar

## Step 7: Wait for Events

The scraper runs automatically every 30 minutes. To trigger it immediately:

```bash
# Restart the scraper service
docker-compose restart go-scraper

# Watch logs
docker-compose logs -f go-scraper
```

Events will appear on the map within 1-2 minutes.

## Troubleshooting

### No events showing?

1. Check scraper logs: `docker-compose logs go-scraper`
2. Check database: `docker exec -it zerocost-postgres psql -U zerocost -c "SELECT COUNT(*) FROM events;"`
3. Trigger manual scrape: `docker-compose restart go-scraper`

### Map not loading?

1. Verify Mapbox token is set in `frontend/.env.local`
2. Check browser console for errors
3. Ensure NEXT_PUBLIC_MAPBOX_TOKEN starts with `pk.`

### Location not detected?

1. Allow location access in browser
2. App defaults to San Francisco if denied
3. Check browser console for geolocation errors

### Services not starting?

```bash
# Check logs
docker-compose logs

# Restart all
docker-compose down
docker-compose up -d

# Check ports are available
lsof -i :5432
lsof -i :6379
lsof -i :8080
lsof -i :8082
lsof -i :8081
```

### Database errors?

```bash
# Reset database
docker-compose down -v
docker-compose up -d
```

## Development Tips

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f java-api
docker-compose logs -f go-scraper
docker-compose logs -f ranking-engine
```

### Restart Services

```bash
# All services
docker-compose restart

# Specific service
docker-compose restart java-api
```

### Database Access

```bash
# Connect to PostgreSQL
docker exec -it zerocost-postgres psql -U zerocost

# Run queries
\dt                    # List tables
SELECT COUNT(*) FROM events;
SELECT * FROM categories;
```

### Redis Access

```bash
# Connect to Redis
docker exec -it zerocost-redis redis-cli

# Commands
KEYS *
GET upcomingEvents*
```

## Next Steps

### Add API Keys (Optional but Recommended)

For better scraping results, add API keys to `.env`:

```bash
# Reddit (https://www.reddit.com/prefs/apps)
REDDIT_CLIENT_ID=your_id
REDDIT_CLIENT_SECRET=your_secret

# Eventbrite (https://www.eventbrite.com/platform/api)
EVENTBRITE_API_KEY=your_key
```

Then restart:
```bash
docker-compose restart go-scraper
```

### Customize

- Edit categories in `infra/postgres/init.sql`
- Add scrapers in `backend/go-scraper/internal/scrapers/`
- Adjust ranking weights in `backend/ranking-engine/src/scoring.cpp`
- Customize UI in `frontend/src/`

### Deploy to Production

See deployment guides:
- [Frontend (Vercel)](./frontend/README.md#deployment)
- [Backend (Render/Railway)](./backend/java-api/README.md#deployment)

## Architecture Overview

```
Frontend (3000) → Java API (8080) → C++ Ranking (8082)
                      ↓                    ↓
                  PostgreSQL (5432)   Redis (6379)
                      ↑
                  Go Scraper (8081)
```

## Helper Scripts

```bash
# Start all services (recommended for development)
./scripts/start-dev.sh

# Stop all services
./scripts/stop-dev.sh

# Test all API endpoints
./scripts/test-api.sh

# Seed sample data (requires Java API running)
./scripts/seed-data.sh
```

## Useful Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v

# View resource usage
docker stats

# Rebuild specific service
docker-compose up -d --build java-api

# Shell into container
docker exec -it zerocost-java-api /bin/sh
```

## Common Issues

### Port already in use
```bash
# Find process using port
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Out of memory
```bash
# Increase Docker memory in Docker Desktop settings
# Recommended: 4GB minimum
```

### Slow performance
```bash
# Check resource usage
docker stats

# Restart services
docker-compose restart
```

## Getting Help

- Check logs: `docker-compose logs -f`
- Read full docs: `README.md`, `SPEC.md`
- Open GitHub issue
- Check `CONTRIBUTING.md`

## Success Checklist

- [ ] All services running: `docker-compose ps`
- [ ] PostgreSQL accessible: `psql` connection works
- [ ] Redis accessible: `redis-cli` connection works
- [ ] API health check: http://localhost:8080/actuator/health returns "UP"
- [ ] Ranking engine: http://localhost:8082/health returns "healthy"
- [ ] Scraper running: logs show "Starting scraper"
- [ ] Frontend loads: http://localhost:3000 shows map
- [ ] Location detected: Blue marker on map at your location
- [ ] Events visible: Event markers on map and in sidebar

## What's Next?

Once everything is running:

1. **Explore the Map**: Click event markers to see details
2. **Try Filters**: Use the search and category filters
3. **Adjust Distance**: Change the distance slider
4. **Check Rankings**: See match scores on event cards
5. **View Sources**: Click external link icons to see original posts

Enjoy discovering free opportunities! 🎯

---

Need help? Open an issue or check the documentation in each service's README.


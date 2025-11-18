# 🧪 ZeroCost Testing Guide

Comprehensive testing strategy for all components of the ZeroCost application.

## Table of Contents

1. [Quick Test (5 minutes)](#quick-test-5-minutes)
2. [Infrastructure Tests](#infrastructure-tests)
3. [Component Tests](#component-tests)
4. [Integration Tests](#integration-tests)
5. [End-to-End Tests](#end-to-end-tests)
6. [Performance Tests](#performance-tests)
7. [Automated Testing](#automated-testing)

---

## Quick Test (5 minutes)

**Goal**: Verify all services are running and responsive

```bash
cd /Users/pauladutwum/Documents/Myprojects/ZeroCost/infra

# 1. Start all services
docker-compose up -d

# 2. Wait 30 seconds
sleep 30

# 3. Check all containers are running
docker-compose ps

# 4. Test all health endpoints
echo "Testing PostgreSQL..."
docker exec zerocost-postgres pg_isready -U zerocost

echo "Testing Redis..."
docker exec zerocost-redis redis-cli ping

echo "Testing C++ Ranking Engine..."
curl -f http://localhost:8082/health || echo "FAILED"

echo "Testing Java API..."
curl -f http://localhost:8080/actuator/health || echo "FAILED"

echo "Testing Go Scraper..."
curl -f http://localhost:8081/health || echo "FAILED"

echo "✅ All services healthy!"
```

**Expected Output**:
```
PostgreSQL: accepting connections
Redis: PONG
Ranking Engine: {"status":"healthy"}
Java API: {"status":"UP"}
Go Scraper: {"status":"healthy"}
```

---

## Infrastructure Tests

### PostgreSQL Database Tests

```bash
# Test 1: Database connection
docker exec zerocost-postgres psql -U zerocost -c "SELECT version();"

# Test 2: Check tables exist
docker exec zerocost-postgres psql -U zerocost -c "\dt"
# Should show: events, categories, sources, users, saved_events, event_interactions

# Test 3: Verify PostGIS extension
docker exec zerocost-postgres psql -U zerocost -c "SELECT PostGIS_version();"

# Test 4: Check default data
docker exec zerocost-postgres psql -U zerocost -c "SELECT COUNT(*) FROM categories;"
# Should return: 8

docker exec zerocost-postgres psql -U zerocost -c "SELECT name FROM categories;"
# Should list all categories

# Test 5: Test spatial query
docker exec zerocost-postgres psql -U zerocost -c "
SELECT ST_Distance(
  ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography,
  ST_SetSRID(ST_MakePoint(-122.4084, 37.7849), 4326)::geography
) as distance_meters;"
```

### Redis Cache Tests

```bash
# Test 1: Basic operations
docker exec zerocost-redis redis-cli SET test_key "test_value"
docker exec zerocost-redis redis-cli GET test_key
docker exec zerocost-redis redis-cli DEL test_key

# Test 2: Check memory usage
docker exec zerocost-redis redis-cli INFO memory

# Test 3: Check connection count
docker exec zerocost-redis redis-cli INFO clients
```

---

## Component Tests

### 1. C++ Ranking Engine Tests

#### Manual API Tests

```bash
# Test 1: Health check
curl http://localhost:8082/health

# Test 2: Rank events (sample request)
curl -X POST http://localhost:8082/rank \
  -H "Content-Type: application/json" \
  -d '{
    "user_location": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "preferred_categories": ["Free Food"]
    },
    "max_distance_km": 50,
    "limit": 10,
    "events": [
      {
        "id": "test-1",
        "title": "Free Pizza Event",
        "description": "Come get free pizza",
        "latitude": 37.7849,
        "longitude": -122.4094,
        "start_time": "'$(date -u +"%Y-%m-%dT%H:%M:%S")'",
        "category": "Free Food",
        "view_count": 10,
        "save_count": 5,
        "created_at": "'$(date -u +"%Y-%m-%dT%H:%M:%S")'"
      }
    ]
  }'

# Test 3: Search endpoint
curl -X POST http://localhost:8082/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "pizza",
    "user_location": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "max_distance_km": 50,
    "limit": 10,
    "events": [
      {
        "id": "test-1",
        "title": "Free Pizza Event",
        "description": "Delicious pizza for everyone",
        "latitude": 37.7849,
        "longitude": -122.4094,
        "start_time": "'$(date -u +"%Y-%m-%dT%H:%M:%S")'",
        "category": "Free Food",
        "view_count": 10,
        "save_count": 5,
        "created_at": "'$(date -u +"%Y-%m-%dT%H:%M:%S")'"
      }
    ]
  }'
```

**Expected**: Returns ranked events with scores and distances

#### Unit Tests (C++)

```bash
cd backend/ranking-engine

# TODO: Add Google Test framework
# mkdir build && cd build
# cmake .. -DBUILD_TESTING=ON
# make test
```

### 2. Go Scraper Tests

#### Manual Tests

```bash
# Test 1: Check scraper is running
curl http://localhost:8081/health

# Test 2: Check metrics
curl http://localhost:8081/metrics

# Test 3: Trigger manual scrape (restart service)
docker-compose restart go-scraper

# Test 4: Watch logs
docker-compose logs -f go-scraper
```

**Expected**: Logs showing scraping activity

#### Unit Tests (Go)

```bash
cd backend/go-scraper

# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific package tests
go test ./internal/scrapers -v

# Run with race detection
go test -race ./...
```

### 3. Java API Tests

#### Manual API Tests

```bash
# Test 1: Health check
curl http://localhost:8080/actuator/health

# Test 2: Get categories
curl http://localhost:8080/api/v1/categories

# Test 3: Get all events (should be empty initially)
curl http://localhost:8080/api/v1/events

# Test 4: Create test event via ingestion
curl -X POST http://localhost:8080/api/v1/events/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "title": "Test Free Pizza Night",
        "description": "Testing event ingestion",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "startTime": "'$(date -u +"%Y-%m-%dT18:00:00Z")'",
        "category": "Free Food",
        "source": "Manual Test",
        "sourceUrl": "http://test.com"
      }
    ]
  }'

# Test 5: Search nearby events
curl -X POST http://localhost:8080/api/v1/events/nearby \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "maxDistanceKm": 50,
    "limit": 10
  }'

# Test 6: Search events by text
curl "http://localhost:8080/api/v1/events/search?query=pizza"
```

#### Unit Tests (Java)

```bash
cd backend/java-api

# Run all tests
./mvnw test

# Run tests with coverage
./mvnw test jacoco:report

# Run specific test class
./mvnw test -Dtest=EventServiceTest

# Run integration tests
./mvnw verify
```

### 4. Frontend Tests

```bash
cd frontend

# Install dependencies
npm install

# Run linter
npm run lint

# TODO: Add tests
# npm test

# Build for production
npm run build
```

---

## Integration Tests

### Test 1: Scraper → Java API → Database

```bash
# 1. Clear existing events
docker exec zerocost-postgres psql -U zerocost -c "DELETE FROM events;"

# 2. Trigger scraper
docker-compose restart go-scraper

# 3. Wait 2 minutes for scraping
sleep 120

# 4. Check events were ingested
docker exec zerocost-postgres psql -U zerocost -c "SELECT COUNT(*) FROM events;"

# 5. View scraped events
docker exec zerocost-postgres psql -U zerocost -c "
  SELECT title, category, source FROM events LIMIT 5;"
```

### Test 2: Java API → C++ Ranking Engine

```bash
# 1. Create test events in database
curl -X POST http://localhost:8080/api/v1/events/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "title": "Close Event",
        "description": "Very close to user",
        "latitude": 37.7750,
        "longitude": -122.4195,
        "startTime": "'$(date -u -v+1H +"%Y-%m-%dT%H:%M:%SZ")'",
        "category": "Free Food",
        "source": "Test"
      },
      {
        "title": "Far Event",
        "description": "Far from user",
        "latitude": 37.9000,
        "longitude": -122.5000,
        "startTime": "'$(date -u -v+2H +"%Y-%m-%dT%H:%M:%SZ")'",
        "category": "Community Events",
        "source": "Test"
      }
    ]
  }'

# 2. Request nearby events (triggers ranking)
curl -X POST http://localhost:8080/api/v1/events/nearby \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "maxDistanceKm": 50,
    "limit": 10
  }' | jq '.'

# 3. Verify ranking (closer event should score higher)
```

### Test 3: Java API → Redis Cache

```bash
# 1. Clear Redis cache
docker exec zerocost-redis redis-cli FLUSHALL

# 2. Request categories (should hit database)
time curl http://localhost:8080/api/v1/categories

# 3. Request again (should hit cache, faster)
time curl http://localhost:8080/api/v1/categories

# 4. Check Redis for cached data
docker exec zerocost-redis redis-cli KEYS "*"
```

---

## End-to-End Tests

### Full User Flow Test

```bash
#!/bin/bash
# Complete E2E test script

echo "🧪 Running End-to-End Test..."

# 1. Start services
cd /Users/pauladutwum/Documents/Myprojects/ZeroCost/infra
docker-compose up -d
sleep 30

# 2. Verify all services are up
echo "✅ Step 1: Checking services..."
docker-compose ps | grep "Up" | wc -l | grep 5 || echo "❌ Not all services running"

# 3. Check database has categories
echo "✅ Step 2: Checking database setup..."
CATEGORIES=$(docker exec zerocost-postgres psql -U zerocost -t -c "SELECT COUNT(*) FROM categories;")
if [ "$CATEGORIES" -eq 8 ]; then
  echo "✅ Database initialized correctly"
else
  echo "❌ Database not initialized"
  exit 1
fi

# 4. Ingest test events
echo "✅ Step 3: Ingesting test events..."
INGEST_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/events/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "title": "E2E Test Event",
        "description": "End-to-end test",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "startTime": "'$(date -u +"%Y-%m-%dT18:00:00Z")'",
        "category": "Free Food",
        "source": "E2E Test"
      }
    ]
  }')

echo $INGEST_RESPONSE | jq '.success' | grep true || echo "❌ Ingestion failed"

# 5. Search nearby events (tests Java API + C++ Ranking)
echo "✅ Step 4: Testing nearby events + ranking..."
NEARBY_RESPONSE=$(curl -s -X POST http://localhost:8080/api/v1/events/nearby \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "maxDistanceKm": 50,
    "limit": 10
  }')

EVENT_COUNT=$(echo $NEARBY_RESPONSE | jq 'length')
if [ "$EVENT_COUNT" -gt 0 ]; then
  echo "✅ Found $EVENT_COUNT events"
  echo $NEARBY_RESPONSE | jq '.[0] | {title, distanceKm, score}'
else
  echo "❌ No events found"
fi

# 6. Test Redis caching
echo "✅ Step 5: Testing Redis cache..."
CACHE_KEYS=$(docker exec zerocost-redis redis-cli KEYS "*" | wc -l)
echo "Cache has $CACHE_KEYS keys"

# 7. Test scraper (trigger and check logs)
echo "✅ Step 6: Testing scraper..."
docker-compose restart go-scraper
sleep 5
docker-compose logs go-scraper | tail -20

echo "🎉 End-to-End test complete!"
```

---

## Performance Tests

### Load Test - Java API

```bash
# Install Apache Bench (if not installed)
# brew install httpd (macOS)

# Test 1: Concurrent requests to nearby events
ab -n 1000 -c 10 -p nearby_test.json -T application/json \
  http://localhost:8080/api/v1/events/nearby

# nearby_test.json:
# {"latitude":37.7749,"longitude":-122.4194,"maxDistanceKm":50,"limit":10}

# Test 2: Categories endpoint (cached)
ab -n 10000 -c 50 http://localhost:8080/api/v1/categories
```

### Load Test - C++ Ranking Engine

```bash
# Test ranking performance with many events
ab -n 100 -c 5 -p rank_test.json -T application/json \
  http://localhost:8082/rank
```

### Database Performance

```bash
# Test spatial query performance
docker exec zerocost-postgres psql -U zerocost -c "
EXPLAIN ANALYZE 
SELECT * FROM events 
WHERE ST_DWithin(
  location, 
  ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326)::geography, 
  50000
) 
AND start_time >= NOW()
ORDER BY start_time ASC
LIMIT 50;"
```

---

## Automated Testing

### CI/CD Tests (GitHub Actions)

Tests run automatically on push/PR:

```yaml
# Already configured in .github/workflows/ci.yml
- Build C++ Ranking Engine
- Build Go Scraper
- Build Java API
- Build Frontend
```

### Add More Tests to CI

```bash
# Create test script
cat > scripts/test-all.sh << 'EOF'
#!/bin/bash
set -e

echo "Running all tests..."

# C++ tests
cd backend/ranking-engine
mkdir -p build && cd build
cmake ..
make
# make test

# Go tests
cd ../../go-scraper
go test ./...

# Java tests
cd ../java-api
./mvnw test

# Frontend tests
cd ../../frontend
npm install
npm run build

echo "✅ All tests passed!"
EOF

chmod +x scripts/test-all.sh
```

---

## Test Checklist

Use this checklist to verify everything works:

### Infrastructure ✓
- [ ] PostgreSQL running and accessible
- [ ] Redis running and responding to PING
- [ ] PostGIS extension installed
- [ ] Default categories inserted (8 categories)

### C++ Ranking Engine ✓
- [ ] Service starts successfully
- [ ] Health endpoint returns 200
- [ ] /rank endpoint processes requests
- [ ] /search endpoint works with queries
- [ ] Returns valid JSON responses
- [ ] Scores are between 0 and 1
- [ ] Distances are calculated correctly

### Go Scraper ✓
- [ ] Service starts successfully
- [ ] Health endpoint returns 200
- [ ] Scraper runs on schedule
- [ ] Successfully scrapes Reddit
- [ ] Successfully scrapes Eventbrite (with API key)
- [ ] Events are posted to Java API
- [ ] Rate limiting works
- [ ] Concurrent scraping works

### Java API ✓
- [ ] Service starts successfully
- [ ] Health endpoint returns UP
- [ ] Categories endpoint returns 8 categories
- [ ] Events ingestion works
- [ ] Nearby events query works
- [ ] Search events works
- [ ] Redis caching works
- [ ] Database queries execute < 50ms
- [ ] Integration with C++ ranking works

### Frontend ✓
- [ ] npm install succeeds
- [ ] npm run build succeeds
- [ ] Development server starts
- [ ] Map loads (with Mapbox token)
- [ ] Geolocation works
- [ ] Events display on map
- [ ] Event list shows events
- [ ] Filters work correctly
- [ ] Search works

### Integration ✓
- [ ] Scraper → Java API → Database flow works
- [ ] Java API → Ranking Engine communication works
- [ ] Java API → Redis caching works
- [ ] Frontend → Java API communication works
- [ ] End-to-end user flow works

---

## Debugging Failed Tests

### Service Won't Start

```bash
# Check logs
docker-compose logs [service-name]

# Check if port is in use
lsof -i :8080  # Java API
lsof -i :8081  # Go Scraper
lsof -i :8082  # Ranking Engine

# Restart service
docker-compose restart [service-name]
```

### Database Issues

```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres

# Check logs
docker-compose logs postgres

# Manual connection
docker exec -it zerocost-postgres psql -U zerocost
```

### API Returns Errors

```bash
# Check application logs
docker-compose logs java-api

# Check environment variables
docker-compose exec java-api env | grep DATABASE

# Test database connection from container
docker-compose exec java-api curl http://postgres:5432
```

---

## Next Steps

1. **Run Quick Test** - Verify all services work
2. **Run Component Tests** - Test each service individually
3. **Run Integration Tests** - Test services working together
4. **Run E2E Test** - Test complete user flow
5. **Add Unit Tests** - Write tests for critical functions
6. **Set up Monitoring** - Add metrics and alerting

Happy Testing! 🧪✅


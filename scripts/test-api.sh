#!/bin/bash

# =============================================================================
# ZeroCost API Test Script
# =============================================================================
# Tests all API endpoints to verify they're working correctly
# =============================================================================

API_URL="${JAVA_API_URL:-http://localhost:8080}"
RANKING_URL="${RANKING_ENGINE_URL:-http://localhost:8082}"
SCRAPER_URL="${SCRAPER_URL:-http://localhost:8081}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧪 Testing ZeroCost API Endpoints"
echo "=================================="

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local data="$4"
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" "$url")
    else
        RESPONSE=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $HTTP_CODE)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $HTTP_CODE)"
        return 1
    fi
}

PASSED=0
FAILED=0

echo ""
echo "📊 Java API (port 8080)"
echo "------------------------"

if test_endpoint "Health Check" "GET" "$API_URL/actuator/health"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "Get Categories" "GET" "$API_URL/api/v1/categories"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "Get Events" "GET" "$API_URL/api/v1/events"; then
    ((PASSED++))
else
    ((FAILED++))
fi

NEARBY_REQUEST='{"latitude":37.7749,"longitude":-122.4194,"maxDistanceKm":50,"limit":20}'
if test_endpoint "Nearby Events" "POST" "$API_URL/api/v1/events/nearby" "$NEARBY_REQUEST"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "Search Events" "GET" "$API_URL/api/v1/events/search?query=food"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "⚡ C++ Ranking Engine (port 8082)"
echo "----------------------------------"

if test_endpoint "Health Check" "GET" "$RANKING_URL/health"; then
    ((PASSED++))
else
    ((FAILED++))
fi

RANK_REQUEST='{
    "user_location": {"latitude": 37.7749, "longitude": -122.4194},
    "max_distance_km": 50,
    "limit": 10,
    "events": [
        {
            "id": "test-1",
            "title": "Test Event",
            "description": "A test event",
            "latitude": 37.7849,
            "longitude": -122.4094,
            "start_time": "2025-01-15T18:00:00",
            "category": "Free Food",
            "view_count": 10,
            "save_count": 5,
            "created_at": "2025-01-10T10:00:00"
        }
    ]
}'
if test_endpoint "Rank Events" "POST" "$RANKING_URL/rank" "$RANK_REQUEST"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "🔍 Go Scraper (port 8081)"
echo "--------------------------"

if test_endpoint "Health Check" "GET" "$SCRAPER_URL/health"; then
    ((PASSED++))
else
    ((FAILED++))
fi

if test_endpoint "Metrics" "GET" "$SCRAPER_URL/metrics"; then
    ((PASSED++))
else
    ((FAILED++))
fi

echo ""
echo "=================================="
echo "Results: ${GREEN}$PASSED passed${NC}, ${RED}$FAILED failed${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check that all services are running.${NC}"
    exit 1
fi


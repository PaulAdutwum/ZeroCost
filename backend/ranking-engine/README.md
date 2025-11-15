# C++ Ranking Engine

High-performance ranking and scoring engine for ZeroCost events.

## Features

- **Distance Scoring**: Haversine distance calculation with exponential decay
- **Urgency Scoring**: Time-based urgency for events starting soon
- **Popularity Scoring**: Logarithmic scaling of views and saves
- **Freshness Scoring**: Boost for newly created events
- **Text Similarity**: Token-based search matching
- **Category Preferences**: User preference weighting
- **Deduplication**: Intelligent duplicate event detection
- **REST API**: Simple HTTP endpoints for ranking requests

## Architecture

The ranking engine is built in C++17 with:
- No external dependencies (except nlohmann/json for JSON parsing)
- Custom HTTP server implementation
- Thread-per-request model
- Optimized scoring algorithms

## Building

### Prerequisites

- CMake 3.20+
- GCC 9+ or Clang 10+
- C++17 compatible compiler

### Build Steps

```bash
mkdir build && cd build
cmake ..
make -j$(nproc)
```

### Running

```bash
./ranking_server
# Server starts on port 8082 (configurable via PORT env var)
```

## Docker

Build and run with Docker:

```bash
docker build -t zerocost-ranking-engine .
docker run -p 8082:8082 zerocost-ranking-engine
```

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "ranking-engine",
  "version": "1.0.0"
}
```

### Rank Events

```bash
POST /rank
Content-Type: application/json
```

Request body:
```json
{
  "user_location": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "preferred_categories": ["Free Food", "Entertainment"]
  },
  "max_distance_km": 50.0,
  "limit": 20,
  "events": [
    {
      "id": "event-1",
      "title": "Free Pizza Night",
      "description": "Free pizza for students",
      "latitude": 37.7849,
      "longitude": -122.4094,
      "start_time": "2025-11-15T18:00:00",
      "end_time": "2025-11-15T20:00:00",
      "category": "Free Food",
      "view_count": 42,
      "save_count": 15,
      "created_at": "2025-11-14T10:00:00"
    }
  ]
}
```

Response:
```json
{
  "total_count": 1,
  "processing_time_ms": 1.23,
  "ranked_events": [
    {
      "id": "event-1",
      "title": "Free Pizza Night",
      "description": "Free pizza for students",
      "latitude": 37.7849,
      "longitude": -122.4094,
      "category": "Free Food",
      "distance_km": 1.42,
      "score": 0.87
    }
  ]
}
```

### Search and Rank

```bash
POST /search
Content-Type: application/json
```

Request body (same as /rank with additional `query` field):
```json
{
  "query": "pizza",
  "user_location": { ... },
  "events": [ ... ]
}
```

## Scoring Algorithm

The final score is a weighted combination of:

| Factor | Weight | Description |
|--------|--------|-------------|
| Distance | 30% | Exponential decay based on distance |
| Urgency | 25% | Events starting soon score higher |
| Popularity | 15% | Logarithmic views + saves |
| Freshness | 15% | Recently posted events |
| Category | 10% | User preference matching |
| Text Similarity | 5% | Query matching (search only) |

### Score Calculation

1. **Distance Score**: `exp(-3 * (distance / max_distance))`
2. **Urgency Score**: Decreases from 1.0 (starting now) to 0.2 (7+ days away)
3. **Popularity Score**: `log(views + 3*saves + 1) / log(1001)`
4. **Freshness Score**: Decreases from 1.0 (just posted) to 0.2 (7+ days old)
5. **Category Score**: 1.0 for preferred, 0.3 otherwise
6. **Text Similarity**: Jaccard similarity on tokenized text

### Deduplication

Events are considered duplicates if:
- Location within 100 meters
- Start time within 1 hour
- Title similarity > 70%

## Performance

Typical performance on commodity hardware:
- 1000 events ranked in ~2-5ms
- 10,000 events ranked in ~20-40ms
- Sub-microsecond per event scoring

## Configuration

Environment variables:
- `PORT`: HTTP server port (default: 8082)
- `LOG_LEVEL`: Logging verbosity (default: info)

## Testing

```bash
# Build tests
cd build
make test

# Manual test
curl -X POST http://localhost:8082/rank \
  -H "Content-Type: application/json" \
  -d @test_request.json
```

## License

MIT License



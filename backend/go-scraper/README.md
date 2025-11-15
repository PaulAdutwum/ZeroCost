# Go Scraper Microservice

Concurrent web scraping service for discovering free events from multiple sources.

## Features

- **Multi-Source Scraping**: Reddit, Eventbrite, Meetup, University pages
- **Concurrent Execution**: Goroutines with rate limiting
- **Scheduled Runs**: Cron-based periodic scraping
- **Rate Limiting**: Respectful scraping with configurable delays
- **Deduplication**: Intelligent event deduplication
- **Geolocation**: Automatic location extraction and geocoding
- **Category Classification**: ML-based event categorization

## Architecture

The scraper is built in Go with:
- Colly framework for web scraping
- Goroutines for concurrent execution
- Rate limiting via `golang.org/x/time/rate`
- Cron scheduling
- RESTful ingestion to Java API

## Sources

### Reddit
- Subreddits: r/freefood, r/freebies, r/FREE, r/randomactsofpizza
- Method: JSON API
- Rate: 1 req/sec

### Eventbrite
- Free events search
- Major cities: SF, NYC, LA, etc.
- Method: REST API v3
- Rate: 1 req/sec

### Meetup
- Free meetups and events
- Method: GraphQL API (OAuth2)
- Rate: 1 req/sec

### University Pages
- UC Berkeley events
- Stanford events
- Method: HTML scraping
- Rate: 1 req/2sec

## Building

```bash
go build -o scraper .
```

## Running

```bash
# Set environment variables
export JAVA_API_URL=http://localhost:8080
export REDDIT_CLIENT_ID=your_id
export REDDIT_CLIENT_SECRET=your_secret
export EVENTBRITE_API_KEY=your_key

# Run scraper
./scraper
```

## Docker

```bash
docker build -t zerocost-scraper .
docker run -p 8081:8081 \
  -e JAVA_API_URL=http://host.docker.internal:8080 \
  -e REDDIT_CLIENT_ID=xxx \
  -e EVENTBRITE_API_KEY=xxx \
  zerocost-scraper
```

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8081 | HTTP server port |
| `JAVA_API_URL` | http://localhost:8080 | Java API endpoint |
| `SCRAPER_INTERVAL_MINUTES` | 30 | Scraping frequency |
| `SCRAPER_USER_AGENT` | ZeroCostBot/1.0 | User agent string |
| `MAX_CONCURRENT_SCRAPERS` | 4 | Parallel scrapers |
| `REQUEST_DELAY_MS` | 1000 | Delay between requests |
| `REDDIT_CLIENT_ID` | - | Reddit API credentials |
| `REDDIT_CLIENT_SECRET` | - | Reddit API credentials |
| `EVENTBRITE_API_KEY` | - | Eventbrite API key |
| `MEETUP_API_KEY` | - | Meetup API key |

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "go-scraper"
}
```

### Metrics

```bash
GET /metrics
```

Response:
```json
{
  "scrapers": 4,
  "last_run": "2025-11-15T10:00:00Z"
}
```

## Scraping Flow

1. **Schedule**: Cron triggers scraping every N minutes
2. **Concurrent Execution**: All scrapers run in parallel (limited by semaphore)
3. **Rate Limiting**: Each request waits for rate limiter
4. **Extraction**: Parse HTML/JSON, extract event data
5. **Geocoding**: Convert locations to coordinates
6. **Categorization**: Classify events by content
7. **Deduplication**: Remove duplicate events
8. **Ingestion**: POST events to Java API

## Event Model

```go
type Event struct {
    Title       string
    Description string
    Latitude    float64
    Longitude   float64
    Address     string
    StartTime   time.Time
    EndTime     *time.Time
    Category    string
    Source      string
    SourceURL   string
    ImageURL    string
    Organizer   string
    Capacity    int
    RawData     map[string]interface{}
}
```

## Location Extraction

The scraper uses multiple strategies:
1. **API Coordinates**: Direct from Eventbrite/Meetup APIs
2. **City Matching**: Keyword matching for major cities
3. **Address Regex**: Extract street addresses
4. **Campus Defaults**: University-specific coordinates

In production, integrate with Google Maps Geocoding API.

## Category Classification

Events are classified into:
- Free Food
- Campus Events
- Community Events
- Giveaways
- Workshops
- Entertainment
- Sports
- Health & Wellness

Classification uses keyword matching and can be enhanced with ML models.

## Rate Limiting

Rate limiting prevents overloading sources:
- Token bucket algorithm
- Configurable rates per source
- Exponential backoff on errors
- Respect `robots.txt`

## Error Handling

- Graceful degradation (one source fails, others continue)
- Retry logic with exponential backoff
- Comprehensive logging
- Health check monitoring

## Testing

```bash
# Run tests
go test ./...

# Run with coverage
go test -cover ./...

# Manual test
curl http://localhost:8081/health
```

## Production Considerations

### Required API Keys

1. **Reddit**: Create app at https://www.reddit.com/prefs/apps
2. **Eventbrite**: Get token at https://www.eventbrite.com/platform/api
3. **Meetup**: OAuth2 setup at https://www.meetup.com/api/

### Geocoding

Replace hardcoded coordinates with:
- Google Maps Geocoding API
- OpenStreetMap Nominatim
- MapBox Geocoding API

### Monitoring

Add:
- Prometheus metrics
- Grafana dashboards
- Alert rules for failures
- Event count tracking

## License

MIT License



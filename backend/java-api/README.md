# Java Spring Boot API

Main backend service for ZeroCost application.

## Features

- **RESTful API**: Event management, search, and ranking
- **PostgreSQL + PostGIS**: Spatial database for geolocation queries
- **Redis Caching**: High-performance caching layer
- **C++ Integration**: Calls ranking engine for event scoring
- **Spring Security**: JWT authentication and authorization
- **Data Ingestion**: Receives events from Go scraper
- **Spatial Queries**: PostGIS for efficient nearby event searches

## Architecture

- Spring Boot 3.2
- Java 17
- PostgreSQL with PostGIS extension
- Redis for caching
- JPA/Hibernate for ORM
- MapStruct for DTO mapping
- Lombok for boilerplate reduction

## API Endpoints

### Events

#### Get All Events (Paginated)
```
GET /api/v1/events?page=0&size=20
```

#### Get Event by ID
```
GET /api/v1/events/{id}
```

#### Get Nearby Events (Ranked)
```
POST /api/v1/events/nearby
Content-Type: application/json

{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "maxDistanceKm": 50,
  "limit": 20,
  "preferredCategoryIds": ["uuid1", "uuid2"],
  "query": "pizza"
}
```

#### Search Events
```
GET /api/v1/events/search?query=free+food
```

#### Get Events by Category
```
GET /api/v1/events/category/{categoryId}
```

#### Ingest Events (Scraper API)
```
POST /api/v1/events/ingest
Content-Type: application/json

{
  "events": [
    {
      "title": "Free Pizza Night",
      "description": "Come get free pizza!",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "address": "123 Main St",
      "startTime": "2025-11-15T18:00:00Z",
      "endTime": "2025-11-15T20:00:00Z",
      "category": "Free Food",
      "source": "Reddit",
      "sourceUrl": "https://...",
      "imageUrl": "https://...",
      "organizer": "John Doe",
      "capacity": 50,
      "rawData": {}
    }
  ]
}
```

### Categories

#### Get All Categories
```
GET /api/v1/categories
```

### Health Check

```
GET /actuator/health
```

## Database Schema

See `infra/postgres/init.sql` for complete schema.

Key tables:
- `events`: Event details with PostGIS location
- `categories`: Event categories
- `sources`: Data sources (Reddit, Eventbrite, etc.)
- `users`: User accounts
- `saved_events`: User saved events
- `event_interactions`: Analytics (views, clicks)

## Ranking Integration

The API integrates with the C++ ranking engine:

1. Fetch events from database using PostGIS spatial query
2. Convert to JSON format
3. POST to C++ ranking engine `/rank` endpoint
4. Receive ranked and scored events
5. Return to client

The ranking engine considers:
- Distance from user
- Time urgency
- Popularity (views/saves)
- Freshness
- Category preferences
- Text similarity (for search)

## Redis Caching

Cached entities:
- `upcomingEvents`: TTL 5 minutes
- `categories`: TTL 1 hour
- Event details: TTL 5 minutes

Cache keys include pagination/filter parameters.

## Configuration

Environment variables (see `application.yml`):

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | jdbc:postgresql://localhost:5432/zerocost | Database connection |
| `POSTGRES_USER` | zerocost | Database user |
| `POSTGRES_PASSWORD` | zerocost123 | Database password |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `RANKING_ENGINE_URL` | http://localhost:8082 | C++ engine URL |
| `JWT_SECRET` | - | JWT signing secret |
| `PORT` | 8080 | Server port |

## Building

```bash
./mvnw clean package
```

## Running

```bash
./mvnw spring-boot:run
```

Or with Java:

```bash
java -jar target/zerocost-api-1.0.0.jar
```

## Docker

```bash
docker build -t zerocost-java-api .
docker run -p 8080:8080 \
  -e DATABASE_URL=jdbc:postgresql://host.docker.internal:5432/zerocost \
  -e REDIS_HOST=host.docker.internal \
  -e RANKING_ENGINE_URL=http://host.docker.internal:8082 \
  zerocost-java-api
```

## Testing

```bash
# Run tests
./mvnw test

# Run with coverage
./mvnw test jacoco:report

# Integration tests
./mvnw verify
```

## Development

### Hot Reload

Use Spring DevTools for automatic restarts:

```bash
./mvnw spring-boot:run -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=5005"
```

### Database Migrations

This project uses JPA with `ddl-auto: validate`. Schema is managed via `init.sql`.

For production, use Flyway or Liquibase.

## Security

- JWT-based authentication (implementation pending)
- CORS enabled for all origins (configure for production)
- Password hashing with BCrypt
- SQL injection prevention via JPA
- Input validation with Bean Validation

## Monitoring

Spring Boot Actuator endpoints:
- `/actuator/health`: Health status
- `/actuator/metrics`: Metrics
- `/actuator/prometheus`: Prometheus metrics

## Performance

Optimization strategies:
- Redis caching for frequent queries
- PostGIS spatial indexes
- Database connection pooling (HikariCP)
- Pagination for large result sets
- Async processing where applicable

## Deployment

### Render/Railway/Fly.io

Set environment variables and deploy from Docker image.

### Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure CORS for specific origins
- [ ] Enable HTTPS/TLS
- [ ] Set up monitoring (New Relic, Datadog)
- [ ] Configure log aggregation
- [ ] Set up database backups
- [ ] Scale Redis (Redis Enterprise/Upstash)
- [ ] CDN for static assets
- [ ] Rate limiting
- [ ] API versioning

## License

MIT License



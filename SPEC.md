# ZeroCost - Complete Technical Specification

## 📌 Mission & Purpose

ZeroCost helps users discover free food, free events, giveaways, campus resources, and community opportunities happening around them in real time.

The high-level purpose of ZeroCost is to:

1. Aggregate free opportunities from scattered sources (Reddit, Eventbrite, Google Places, campus pages)
2. Rank and personalize these opportunities using a high-performance C++ scoring engine
3. Display them beautifully on an interactive map-based frontend
4. Notify users instantly whenever new free opportunities appear near them
5. Reduce waste, increase community participation, and help people save money

ZeroCost combines Java, Go, C++, Next.js, Redis, and PostgreSQL into one modern, scalable application.

This is a systems engineering portfolio project designed to demonstrate:
- Distributed architecture
- Microservices
- Real-time ingestion
- Ranking algorithms
- Multi-language integration
- Containerization and deployment
- Clean Web UI/UX

## 📐 High-Level Architecture

### System Components

1. **Frontend (Next.js — Vercel)**
   - Provides a polished UI for users to browse opportunities on a map
   - Apply filters, manage accounts, receive notifications
   - Built with TypeScript, Tailwind CSS, Mapbox GL JS

2. **Backend (Java Spring Boot)**
   - Acts as the main application API
   - Orchestrates data flow between Go scrapers, C++ ranking engine, Redis, and database
   - Handles authentication, data validation, caching

3. **Integrations Layer**
   - Redis (cache)
   - PostgreSQL (database with PostGIS)
   - Firebase Cloud Messaging (notifications)
   - Kafka/RabbitMQ (optional pipeline)

4. **C++ Ranking Engine**
   - High-performance module for calculating:
     - Distance scores
     - Popularity scores
     - Urgency scores
     - Text similarity
     - Deduplication
     - Priority queue ranking

5. **Go Scraper Microservice**
   - Scrapes free events from public sources
   - Pushes them into the backend ingestion API
   - Concurrent execution with rate limiting

6. **Deployment**
   - Monorepo with containerized services
   - Vercel (frontend)
   - Render/Fly.io/Railway (backend & microservices)
   - Docker Compose for local development

## 🏗️ Architecture Diagram

```
                    ┌────────────────────────────┐
                    │         Next.js UI          │
                    │      (Vercel Frontend)      │
                    └──────────────┬─────────────┘
                                   │
                                   ▼
                     ┌─────────────────────────┐
                     │ Java Spring Boot API    │
                     │ (Main Backend Service)  │
                     └───┬─────────┬──────────┘
                         │         │
        ┌────────────────┘         └─────────────────┐
        ▼                                            ▼
┌──────────────┐                              ┌────────────────────┐
│ Go Scraper    │ --POST events-->            │ C++ Ranking Engine │
│ Microservice  │                              │  (REST/gRPC)      │
└──────────────┘                              └────────────────────┘
                         │
                         ▼
              ┌───────────────────────┐
              │ PostgreSQL (Database) │
              └───────────────────────┘
                         │
                         ▼
              ┌───────────────────────┐
              │ Redis Cache (Upstash) │
              └───────────────────────┘
```

## 📂 Project Structure

```
zerocost/
│
├── frontend/                 # Next.js frontend (Vercel)
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
│
├── backend/
│   ├── java-api/            # Spring Boot backend
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── java/com/zerocost/
│   │   │       │   ├── entity/
│   │   │       │   ├── repository/
│   │   │       │   ├── service/
│   │   │       │   ├── controller/
│   │   │       │   ├── config/
│   │   │       │   └── exception/
│   │   │       └── resources/
│   │   ├── pom.xml
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   ├── go-scraper/          # Go scraper microservice
│   │   ├── main.go
│   │   ├── internal/
│   │   │   ├── config/
│   │   │   ├── models/
│   │   │   ├── scrapers/
│   │   │   └── ingestion/
│   │   ├── go.mod
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   └── ranking-engine/      # C++ ranking engine
│       ├── src/
│       ├── include/
│       ├── CMakeLists.txt
│       ├── Dockerfile
│       └── README.md
│
├── infra/
│   ├── docker-compose.yml   # For local dev
│   ├── postgres/
│   │   └── init.sql
│   └── redis/
│
├── .gitignore
├── .env.example
├── README.md
└── SPEC.md                  # This specification
```

## 🗄️ Database Schema

### Tables

**events**
- id (UUID, PK)
- title (VARCHAR)
- description (TEXT)
- latitude (DOUBLE)
- longitude (DOUBLE)
- location (GEOGRAPHY POINT) — PostGIS
- address (TEXT)
- start_time (TIMESTAMP)
- end_time (TIMESTAMP)
- category_id (UUID, FK)
- source_id (UUID, FK)
- source_url (TEXT)
- image_url (TEXT)
- organizer_name (VARCHAR)
- organizer_contact (VARCHAR)
- capacity (INT)
- is_verified (BOOLEAN)
- raw_data (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**categories**
- id (UUID, PK)
- name (VARCHAR, UNIQUE)
- description (TEXT)
- icon (VARCHAR)
- created_at (TIMESTAMP)

**sources**
- id (UUID, PK)
- name (VARCHAR, UNIQUE)
- url (TEXT)
- scraper_type (VARCHAR)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)

**users**
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- full_name (VARCHAR)
- profile_image_url (TEXT)
- home_latitude (DOUBLE)
- home_longitude (DOUBLE)
- notification_radius_km (DOUBLE)
- push_token (TEXT)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**saved_events**
- id (UUID, PK)
- user_id (UUID, FK)
- event_id (UUID, FK)
- created_at (TIMESTAMP)

**event_interactions**
- id (UUID, PK)
- event_id (UUID, FK)
- user_id (UUID, FK)
- interaction_type (VARCHAR) — 'view', 'click', 'save', 'share'
- created_at (TIMESTAMP)

## 🧮 C++ Ranking Algorithm

The scoring function includes:

### Factors

1. **Distance Score** (30% weight)
   - Exponential decay: `exp(-3 * (distance / max_distance))`
   - Closer events score higher

2. **Urgency Score** (25% weight)
   - Events starting soon get higher scores
   - 0-2 hours: 1.0
   - 2-24 hours: 0.8-0.5
   - 1-7 days: 0.5-0.2
   - 7+ days: 0.2

3. **Popularity Score** (15% weight)
   - Logarithmic scaling: `log(views + 3*saves + 1) / log(1001)`
   - Prevents very popular events from dominating

4. **Freshness Score** (15% weight)
   - Recently created events score higher
   - 0-1 hour: 1.0
   - 1-24 hours: 0.9-0.5
   - 1-7 days: 0.5-0.2
   - 7+ days: 0.2

5. **Category Score** (10% weight)
   - 1.0 for preferred categories
   - 0.3 for non-preferred

6. **Text Similarity** (5% weight)
   - Jaccard similarity on tokenized text
   - Only used for search queries

### Deduplication

Events are considered duplicates if:
- Location within 100 meters
- Start time within 1 hour
- Title similarity > 70%

## 💻 Go Scraper Sources

### Reddit
- Subreddits: r/freefood, r/freebies, r/FREE, r/randomactsofpizza
- Method: JSON API
- Rate: 1 req/sec

### Eventbrite
- Free events search
- Major cities
- Method: REST API v3
- Rate: 1 req/sec

### Meetup
- Free meetups
- Method: GraphQL API
- Rate: 1 req/sec

### University Pages
- UC Berkeley, Stanford
- Method: HTML scraping
- Rate: 1 req/2sec

## ☕ Java Spring Boot API Endpoints

### Events

```
POST /api/v1/events/ingest        # Ingest events from scraper
GET  /api/v1/events               # Get all events (paginated)
GET  /api/v1/events/{id}          # Get event by ID
POST /api/v1/events/nearby        # Get nearby ranked events
GET  /api/v1/events/search        # Search events
GET  /api/v1/events/category/{id} # Get events by category
```

### Categories

```
GET  /api/v1/categories           # Get all categories
```

### Health

```
GET  /actuator/health             # Health check
GET  /actuator/metrics            # Metrics
```

## 🔑 Environment Variables

See `.env.example` for complete list.

### Critical Variables

- `DATABASE_URL` — PostgreSQL connection
- `REDIS_URL` — Redis connection
- `RANKING_ENGINE_URL` — C++ engine URL
- `JWT_SECRET` — Authentication secret
- `NEXT_PUBLIC_MAPBOX_TOKEN` — Mapbox token
- `REDDIT_CLIENT_ID/SECRET` — Reddit API
- `EVENTBRITE_API_KEY` — Eventbrite API

## 🐳 Docker Deployment

All services can be deployed with:

```bash
docker-compose -f infra/docker-compose.yml up --build
```

Services:
- postgres:5432
- redis:6379
- ranking-engine:8082
- java-api:8080
- go-scraper:8081
- frontend:3000 (local only, use Vercel for prod)

## 🚀 Production Deployment

### Frontend (Vercel)
- Push to GitHub
- Import in Vercel
- Add environment variables
- Auto-deploy on push

### Backend (Render/Railway/Fly.io)
- Connect repository
- Set environment variables
- Deploy from Dockerfile

### Database (Supabase/Neon/Render)
- PostgreSQL with PostGIS extension
- Set DATABASE_URL in backend

### Redis (Upstash/Redis Cloud)
- Managed Redis instance
- Set REDIS_URL in backend

## 📊 Performance Targets

- Event ranking: < 10ms for 1000 events
- API response time: < 200ms p95
- Database queries: < 50ms
- Redis cache hit rate: > 80%
- Frontend load time: < 2s

## 🔐 Security

- JWT authentication
- HTTPS/TLS
- CORS configuration
- SQL injection prevention (JPA)
- Input validation
- Rate limiting
- Environment secrets

## 📈 Monitoring

- Spring Boot Actuator
- Prometheus metrics
- Health checks
- Error logging
- Performance tracking

## 🎯 Future Enhancements

- User authentication
- Push notifications
- Event recommendations (ML)
- Social features (share, comment)
- Calendar integration
- Mobile app (React Native)
- Event verification system
- Admin dashboard

## 📝 License

MIT License

---

This specification defines the complete ZeroCost application architecture, implementation, and deployment strategy.


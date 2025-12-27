# 🎯 ZeroCost

**Discover free food, events, giveaways, and community opportunities in real-time.**

ZeroCost is a full-stack, multi-language application that aggregates, ranks, and displays free opportunities on an interactive map. Built as a systems engineering portfolio project demonstrating distributed architecture, microservices, and modern web development.

##  Architecture

- **Frontend**: Next.js (TypeScript, React, Mapbox)
- **Backend API**: Java Spring Boot
- **Scraper**: Go microservice with concurrent scrapers
- **Ranking Engine**: C++ high-performance scoring
- **Database**: PostgreSQL
- **Cache**: Redis
- **Deployment**: Docker, Vercel, Render/Fly.io

##  Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Java 17+
- Go 1.22+
- CMake 3.20+

### Local Development

1. **Clone the repository**
```bash
git clone <repo-url>
cd ZeroCost
```

2. **Set up environment variables**
```bash

cp .env.example .env
# Edit .env with your credentials
```

3. **Start infrastructure services**
```bash

cd infra
docker-compose up -d
```

4. **Run each service**

**C++ Ranking Engine:**
```bash
cd backend/ranking-engine
mkdir build && cd build
cmake ..
make
./ranking_server
```

**Go Scraper:**
```bash
cd backend/go-scraper
go run main.go
```

**Java API:**
```bash
cd backend/java-api
./mvnw spring-boot:run
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Access the app at `http://localhost:3000`

##  Docker Deployment

Build and run all services with Docker Compose:

```bash
docker-compose -f infra/docker-compose.yml up --build
```

## Testing

Each service includes its own test suite:

```bash
# Java API
cd backend/java-api && ./mvnw test

# Go Scraper
cd backend/go-scraper && go test ./...

# C++ Engine
cd backend/ranking-engine/build && make test

# Frontend
cd frontend && npm test
```

## Documentation

- [Frontend Documentation](./frontend/README.md)
- [Java API Documentation](./backend/java-api/README.md)
- [Go Scraper Documentation](./backend/go-scraper/README.md)
- [C++ Ranking Engine Documentation](./backend/ranking-engine/README.md)

## Project Structure

```
zerocost/
├── frontend/              # Next.js frontend
├── backend/
│   ├── java-api/         # Spring Boot API
│   ├── go-scraper/       # Go scraper microservice
│   └── ranking-engine/   # C++ ranking engine
├── infra/                # Docker Compose & configs
└── SPEC.md              # Full specification
```

##  Environment Variables

See `.env` for required environment variables.

## Contributing

This is a portfolio project, but feedback and suggestions are welcome!

## License

MIT License



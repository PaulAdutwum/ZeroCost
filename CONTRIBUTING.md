# Contributing to ZeroCost

Thank you for your interest in contributing to ZeroCost! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/ZeroCost.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit: `git commit -m "Add feature: your feature description"`
7. Push: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Java 17+
- Go 1.22+
- CMake 3.20+

### Running Locally

```bash
# Start infrastructure
cd infra
docker-compose up -d postgres redis

# Start C++ Ranking Engine
cd backend/ranking-engine
mkdir build && cd build
cmake .. && make
./ranking_server

# Start Go Scraper
cd backend/go-scraper
go run main.go

# Start Java API
cd backend/java-api
./mvnw spring-boot:run

# Start Frontend
cd frontend
npm install
npm run dev
```

## Code Style

### TypeScript/JavaScript
- Use ESLint configuration
- 2 spaces for indentation
- Semicolons required
- Use TypeScript types

### Java
- Follow Spring Boot conventions
- Use Lombok for boilerplate
- Write JavaDoc for public methods

### Go
- Run `go fmt` before committing
- Follow Go idioms
- Write table-driven tests

### C++
- Follow Google C++ Style Guide
- Use C++17 features
- Document complex algorithms

## Testing

```bash
# Frontend
cd frontend && npm test

# Java API
cd backend/java-api && ./mvnw test

# Go Scraper
cd backend/go-scraper && go test ./...

# C++ Engine
cd backend/ranking-engine/build && make test
```

## Pull Request Guidelines

- Keep PRs focused and small
- Write clear commit messages
- Update documentation
- Add tests for new features
- Ensure all tests pass
- Request review from maintainers

## Reporting Issues

- Use GitHub Issues
- Include reproduction steps
- Provide environment details
- Add relevant logs/screenshots

## Feature Requests

- Open a GitHub Issue
- Describe the feature
- Explain use case
- Discuss implementation approach

## Code Review Process

1. Automated CI checks must pass
2. At least one maintainer approval required
3. No merge conflicts
4. Documentation updated
5. Tests included

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Open a GitHub Discussion
- Email: [your-email]
- Discord: [your-discord]

Thank you for contributing to ZeroCost! 🎯


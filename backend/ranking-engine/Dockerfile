# Build stage
FROM ubuntu:22.04 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy source files
COPY CMakeLists.txt ./
COPY include/ ./include/
COPY src/ ./src/

# Download json.hpp if not present
RUN if [ ! -f include/json.hpp ]; then \
    curl -L https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp \
    -o include/json.hpp; \
    fi

# Build
RUN mkdir build && cd build && \
    cmake .. && \
    make -j$(nproc)

# Runtime stage
FROM ubuntu:22.04

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libstdc++6 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/build/ranking_server .

# Expose port
EXPOSE 8082

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8082/health || exit 1

# Run server
CMD ["./ranking_server"]



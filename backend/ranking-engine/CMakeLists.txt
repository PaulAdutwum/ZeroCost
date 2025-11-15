cmake_minimum_required(VERSION 3.20)
project(ZeroCostRankingEngine VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Compiler flags
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -O3")

# Find required packages
find_package(Threads REQUIRED)

# Include directories
include_directories(${CMAKE_SOURCE_DIR}/include)

# Source files
set(SOURCES
    src/main.cpp
    src/ranking_service.cpp
    src/scoring.cpp
    src/distance.cpp
    src/http_server.cpp
)

# Headers
set(HEADERS
    include/ranking_service.h
    include/scoring.h
    include/distance.h
    include/http_server.h
    include/event.h
    include/json.hpp
)

# Executable
add_executable(ranking_server ${SOURCES} ${HEADERS})

# Link libraries
target_link_libraries(ranking_server PRIVATE Threads::Threads)

# Install target
install(TARGETS ranking_server DESTINATION bin)



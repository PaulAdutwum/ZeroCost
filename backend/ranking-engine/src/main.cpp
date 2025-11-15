#include "http_server.h"
#include "ranking_service.h"
#include "json.hpp"
#include <iostream>
#include <cstdlib>
#include <csignal>

using json = nlohmann::json;
using namespace zerocost;

HttpServer* server_ptr = nullptr;

void signal_handler(int signal) {
    if (signal == SIGINT || signal == SIGTERM) {
        std::cout << "\nShutting down server..." << std::endl;
        if (server_ptr) {
            server_ptr->stop();
        }
        exit(0);
    }
}

std::time_t parse_iso8601(const std::string& datetime) {
    std::tm tm = {};
    std::istringstream ss(datetime);
    ss >> std::get_time(&tm, "%Y-%m-%dT%H:%M:%S");
    return std::mktime(&tm);
}

Event parse_event(const json& j) {
    Event event;
    event.id = j.value("id", "");
    event.title = j.value("title", "");
    event.description = j.value("description", "");
    event.latitude = j.value("latitude", 0.0);
    event.longitude = j.value("longitude", 0.0);
    event.category = j.value("category", "");
    event.view_count = j.value("view_count", 0);
    event.save_count = j.value("save_count", 0);
    
    // Parse timestamps
    if (j.contains("start_time")) {
        event.start_time = parse_iso8601(j["start_time"]);
    } else {
        event.start_time = std::time(nullptr);
    }
    
    if (j.contains("end_time")) {
        event.end_time = parse_iso8601(j["end_time"]);
    } else {
        event.end_time = event.start_time + 3600; // 1 hour default
    }
    
    if (j.contains("created_at")) {
        event.created_at = parse_iso8601(j["created_at"]);
    } else {
        event.created_at = std::time(nullptr);
    }
    
    return event;
}

json event_to_json(const Event& event) {
    return json{
        {"id", event.id},
        {"title", event.title},
        {"description", event.description},
        {"latitude", event.latitude},
        {"longitude", event.longitude},
        {"category", event.category},
        {"distance_km", event.distance_km},
        {"score", event.score}
    };
}

int main() {
    std::cout << "Starting ZeroCost Ranking Engine..." << std::endl;
    
    // Get port from environment or use default
    int port = 8082;
    const char* port_env = std::getenv("PORT");
    if (port_env) {
        port = std::atoi(port_env);
    }
    
    HttpServer server(port);
    server_ptr = &server;
    
    // Set up signal handlers
    std::signal(SIGINT, signal_handler);
    std::signal(SIGTERM, signal_handler);
    
    RankingService ranking_service;
    
    // Health check endpoint
    server.add_route("GET", "/health", [](const std::string&) {
        return json{
            {"status", "healthy"},
            {"service", "ranking-engine"},
            {"version", "1.0.0"}
        }.dump();
    });
    
    // Rank events endpoint
    server.add_route("POST", "/rank", [&ranking_service](const std::string& body) {
        try {
            json request_json = json::parse(body);
            
            // Parse request
            RankingRequest request;
            request.user_location.latitude = request_json["user_location"]["latitude"];
            request.user_location.longitude = request_json["user_location"]["longitude"];
            request.user_location.current_time = std::time(nullptr);
            
            if (request_json["user_location"].contains("preferred_categories")) {
                for (const auto& cat : request_json["user_location"]["preferred_categories"]) {
                    request.user_location.preferred_categories.push_back(cat);
                }
            }
            
            request.max_distance_km = request_json.value("max_distance_km", 50.0);
            request.limit = request_json.value("limit", 100);
            
            // Parse events
            for (const auto& event_json : request_json["events"]) {
                request.events.push_back(parse_event(event_json));
            }
            
            // Rank events
            RankingResponse response = ranking_service.rank_events(request);
            
            // Build response
            json response_json;
            response_json["total_count"] = response.total_count;
            response_json["processing_time_ms"] = response.processing_time_ms;
            response_json["ranked_events"] = json::array();
            
            for (const auto& event : response.ranked_events) {
                response_json["ranked_events"].push_back(event_to_json(event));
            }
            
            return response_json.dump();
        } catch (const json::exception& e) {
            return json{
                {"error", "Invalid JSON"},
                {"message", e.what()}
            }.dump();
        }
    });
    
    // Search and rank endpoint
    server.add_route("POST", "/search", [&ranking_service](const std::string& body) {
        try {
            json request_json = json::parse(body);
            
            // Parse request
            RankingRequest request;
            request.user_location.latitude = request_json["user_location"]["latitude"];
            request.user_location.longitude = request_json["user_location"]["longitude"];
            request.user_location.current_time = std::time(nullptr);
            
            if (request_json["user_location"].contains("preferred_categories")) {
                for (const auto& cat : request_json["user_location"]["preferred_categories"]) {
                    request.user_location.preferred_categories.push_back(cat);
                }
            }
            
            request.max_distance_km = request_json.value("max_distance_km", 50.0);
            request.limit = request_json.value("limit", 100);
            
            std::string query = request_json.value("query", "");
            
            // Parse events
            for (const auto& event_json : request_json["events"]) {
                request.events.push_back(parse_event(event_json));
            }
            
            // Search and rank events
            RankingResponse response = ranking_service.search_and_rank(request, query);
            
            // Build response
            json response_json;
            response_json["query"] = query;
            response_json["total_count"] = response.total_count;
            response_json["processing_time_ms"] = response.processing_time_ms;
            response_json["ranked_events"] = json::array();
            
            for (const auto& event : response.ranked_events) {
                response_json["ranked_events"].push_back(event_to_json(event));
            }
            
            return response_json.dump();
        } catch (const json::exception& e) {
            return json{
                {"error", "Invalid JSON"},
                {"message", e.what()}
            }.dump();
        }
    });
    
    std::cout << "Ranking Engine initialized successfully!" << std::endl;
    
    // Start server (blocks)
    server.run();
    
    return 0;
}



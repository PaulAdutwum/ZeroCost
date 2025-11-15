#include "ranking_service.h"
#include "distance.h"
#include "scoring.h"
#include <algorithm>
#include <chrono>

namespace zerocost {

void RankingService::calculate_distances(std::vector<Event>& events, 
                                         const UserLocation& user_location,
                                         double max_distance_km) {
    // Remove events that are too far
    events.erase(
        std::remove_if(events.begin(), events.end(), [&](Event& event) {
            event.distance_km = haversine_distance(
                user_location.latitude, user_location.longitude,
                event.latitude, event.longitude
            );
            return event.distance_km > max_distance_km;
        }),
        events.end()
    );
}

void RankingService::calculate_scores(std::vector<Event>& events, 
                                      const UserLocation& user_location,
                                      const std::string& query) {
    for (auto& event : events) {
        event.score = calculate_final_score(event, user_location, query);
    }
}

void RankingService::sort_by_score(std::vector<Event>& events) {
    std::sort(events.begin(), events.end(), [](const Event& a, const Event& b) {
        return a.score > b.score; // Descending order
    });
}

RankingResponse RankingService::rank_events(const RankingRequest& request) {
    auto start_time = std::chrono::high_resolution_clock::now();
    
    RankingResponse response;
    response.ranked_events = request.events;
    
    // Step 1: Calculate distances and filter by max distance
    calculate_distances(response.ranked_events, request.user_location, request.max_distance_km);
    
    // Step 2: Deduplicate events
    deduplicate_events(response.ranked_events);
    
    // Step 3: Calculate scores
    calculate_scores(response.ranked_events, request.user_location);
    
    // Step 4: Sort by score
    sort_by_score(response.ranked_events);
    
    // Step 5: Apply limit
    response.total_count = response.ranked_events.size();
    if (request.limit > 0 && response.ranked_events.size() > static_cast<size_t>(request.limit)) {
        response.ranked_events.resize(request.limit);
    }
    
    auto end_time = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end_time - start_time);
    response.processing_time_ms = duration.count() / 1000.0;
    
    return response;
}

RankingResponse RankingService::search_and_rank(const RankingRequest& request, 
                                                const std::string& query) {
    auto start_time = std::chrono::high_resolution_clock::now();
    
    RankingResponse response;
    response.ranked_events = request.events;
    
    // Step 1: Calculate distances and filter by max distance
    calculate_distances(response.ranked_events, request.user_location, request.max_distance_km);
    
    // Step 2: Deduplicate events
    deduplicate_events(response.ranked_events);
    
    // Step 3: Calculate scores with query
    calculate_scores(response.ranked_events, request.user_location, query);
    
    // Step 4: Filter by minimum text similarity threshold
    if (!query.empty()) {
        response.ranked_events.erase(
            std::remove_if(response.ranked_events.begin(), response.ranked_events.end(), 
                          [&](const Event& event) {
                std::string event_text = event.title + " " + event.description;
                return calculate_text_similarity(query, event_text) < 0.1;
            }),
            response.ranked_events.end()
        );
    }
    
    // Step 5: Sort by score
    sort_by_score(response.ranked_events);
    
    // Step 6: Apply limit
    response.total_count = response.ranked_events.size();
    if (request.limit > 0 && response.ranked_events.size() > static_cast<size_t>(request.limit)) {
        response.ranked_events.resize(request.limit);
    }
    
    auto end_time = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end_time - start_time);
    response.processing_time_ms = duration.count() / 1000.0;
    
    return response;
}

} // namespace zerocost



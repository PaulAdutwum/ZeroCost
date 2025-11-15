#ifndef EVENT_H
#define EVENT_H

#include <string>
#include <ctime>
#include <vector>

namespace zerocost {

struct Event {
    std::string id;
    std::string title;
    std::string description;
    double latitude;
    double longitude;
    std::time_t start_time;
    std::time_t end_time;
    std::string category;
    int view_count;
    int save_count;
    std::time_t created_at;
    
    // Calculated fields
    double distance_km;
    double score;
};

struct UserLocation {
    double latitude;
    double longitude;
    std::time_t current_time;
    std::vector<std::string> preferred_categories;
};

struct RankingRequest {
    UserLocation user_location;
    std::vector<Event> events;
    double max_distance_km;
    int limit;
};

struct RankingResponse {
    std::vector<Event> ranked_events;
    int total_count;
    double processing_time_ms;
};

} // namespace zerocost

#endif // EVENT_H



#include "scoring.h"
#include "distance.h"
#include <cmath>
#include <algorithm>
#include <sstream>
#include <cctype>
#include <set>

namespace zerocost {

constexpr double SECONDS_PER_HOUR = 3600.0;
constexpr double SECONDS_PER_DAY = 86400.0;

std::string to_lowercase(const std::string& str) {
    std::string result = str;
    std::transform(result.begin(), result.end(), result.begin(), ::tolower);
    return result;
}

std::set<std::string> tokenize(const std::string& text) {
    std::set<std::string> tokens;
    std::istringstream stream(to_lowercase(text));
    std::string word;
    
    while (stream >> word) {
        // Remove punctuation
        word.erase(std::remove_if(word.begin(), word.end(), ::ispunct), word.end());
        if (!word.empty()) {
            tokens.insert(word);
        }
    }
    
    return tokens;
}

double calculate_urgency_score(std::time_t start_time, std::time_t current_time) {
    double time_diff_seconds = std::difftime(start_time, current_time);
    
    // Event already started or in the past
    if (time_diff_seconds <= 0) {
        return 0.5; // Medium urgency for ongoing events
    }
    
    double time_diff_hours = time_diff_seconds / SECONDS_PER_HOUR;
    
    // Events within 2 hours: very urgent
    if (time_diff_hours < 2.0) {
        return 1.0;
    }
    
    // Events within 24 hours: high urgency
    if (time_diff_hours < 24.0) {
        return 0.8 - (time_diff_hours - 2.0) / 22.0 * 0.3; // 0.8 to 0.5
    }
    
    // Events within 7 days: medium urgency
    double time_diff_days = time_diff_seconds / SECONDS_PER_DAY;
    if (time_diff_days < 7.0) {
        return 0.5 - (time_diff_days - 1.0) / 6.0 * 0.3; // 0.5 to 0.2
    }
    
    // Events beyond 7 days: low urgency
    return 0.2;
}

double calculate_popularity_score(int view_count, int save_count) {
    // Logarithmic scaling to prevent very popular events from dominating
    // Saves are weighted 3x more than views
    double weighted_engagement = view_count + (save_count * 3);
    
    if (weighted_engagement == 0) {
        return 0.0;
    }
    
    // Normalize using log scale
    // score = log(engagement + 1) / log(1001) gives score between 0 and 1
    // for engagement from 0 to 1000
    double score = std::log(weighted_engagement + 1.0) / std::log(1001.0);
    return std::min(score, 1.0);
}

double calculate_freshness_score(std::time_t created_at, std::time_t current_time) {
    double age_seconds = std::difftime(current_time, created_at);
    double age_hours = age_seconds / SECONDS_PER_HOUR;
    
    // Events created within 1 hour: maximum freshness
    if (age_hours < 1.0) {
        return 1.0;
    }
    
    // Events created within 24 hours: high freshness
    if (age_hours < 24.0) {
        return 0.9 - (age_hours - 1.0) / 23.0 * 0.4; // 0.9 to 0.5
    }
    
    // Events created within 7 days: medium freshness
    double age_days = age_seconds / SECONDS_PER_DAY;
    if (age_days < 7.0) {
        return 0.5 - (age_days - 1.0) / 6.0 * 0.3; // 0.5 to 0.2
    }
    
    // Older events: low freshness
    return 0.2;
}

double calculate_text_similarity(const std::string& query, const std::string& text) {
    if (query.empty()) {
        return 0.5; // Neutral score when no query
    }
    
    auto query_tokens = tokenize(query);
    auto text_tokens = tokenize(text);
    
    if (query_tokens.empty() || text_tokens.empty()) {
        return 0.0;
    }
    
    // Calculate Jaccard similarity (intersection / union)
    std::set<std::string> intersection;
    std::set_intersection(query_tokens.begin(), query_tokens.end(),
                         text_tokens.begin(), text_tokens.end(),
                         std::inserter(intersection, intersection.begin()));
    
    std::set<std::string> union_set;
    std::set_union(query_tokens.begin(), query_tokens.end(),
                   text_tokens.begin(), text_tokens.end(),
                   std::inserter(union_set, union_set.begin()));
    
    double jaccard = static_cast<double>(intersection.size()) / union_set.size();
    
    // Boost score if all query words are present
    if (intersection.size() == query_tokens.size()) {
        jaccard = std::min(jaccard * 1.5, 1.0);
    }
    
    return jaccard;
}

double calculate_category_score(const std::string& event_category, 
                                const std::vector<std::string>& preferred_categories) {
    if (preferred_categories.empty()) {
        return 0.5; // Neutral score when no preferences
    }
    
    std::string event_cat_lower = to_lowercase(event_category);
    
    for (const auto& pref : preferred_categories) {
        if (to_lowercase(pref) == event_cat_lower) {
            return 1.0;
        }
    }
    
    return 0.3; // Lower score for non-preferred categories
}

double calculate_final_score(const Event& event, 
                             const UserLocation& user_location,
                             const std::string& query) {
    // Weight factors for different components
    constexpr double WEIGHT_DISTANCE = 0.30;
    constexpr double WEIGHT_URGENCY = 0.25;
    constexpr double WEIGHT_POPULARITY = 0.15;
    constexpr double WEIGHT_FRESHNESS = 0.15;
    constexpr double WEIGHT_CATEGORY = 0.10;
    constexpr double WEIGHT_TEXT_SIMILARITY = 0.05;
    
    // Calculate individual scores
    double distance_score = calculate_distance_score(event.distance_km, 50.0);
    double urgency_score = calculate_urgency_score(event.start_time, user_location.current_time);
    double popularity_score = calculate_popularity_score(event.view_count, event.save_count);
    double freshness_score = calculate_freshness_score(event.created_at, user_location.current_time);
    double category_score = calculate_category_score(event.category, user_location.preferred_categories);
    
    double text_similarity = 0.5;
    if (!query.empty()) {
        std::string event_text = event.title + " " + event.description;
        text_similarity = calculate_text_similarity(query, event_text);
    }
    
    // Weighted sum
    double final_score = 
        WEIGHT_DISTANCE * distance_score +
        WEIGHT_URGENCY * urgency_score +
        WEIGHT_POPULARITY * popularity_score +
        WEIGHT_FRESHNESS * freshness_score +
        WEIGHT_CATEGORY * category_score +
        WEIGHT_TEXT_SIMILARITY * text_similarity;
    
    // Boost very close events
    if (event.distance_km < 1.0) {
        final_score *= 1.2;
    }
    
    return std::min(final_score, 1.0);
}

bool are_events_duplicate(const Event& event1, const Event& event2) {
    // Check location similarity (within 100 meters)
    double distance = haversine_distance(event1.latitude, event1.longitude,
                                        event2.latitude, event2.longitude);
    if (distance > 0.1) { // 100 meters
        return false;
    }
    
    // Check time similarity (within 1 hour)
    double time_diff = std::abs(std::difftime(event1.start_time, event2.start_time));
    if (time_diff > 3600.0) {
        return false;
    }
    
    // Check title similarity
    auto tokens1 = tokenize(event1.title);
    auto tokens2 = tokenize(event2.title);
    
    std::set<std::string> intersection;
    std::set_intersection(tokens1.begin(), tokens1.end(),
                         tokens2.begin(), tokens2.end(),
                         std::inserter(intersection, intersection.begin()));
    
    double title_similarity = static_cast<double>(intersection.size()) / 
                             std::max(tokens1.size(), tokens2.size());
    
    // Consider duplicates if >70% title overlap
    return title_similarity > 0.7;
}

void deduplicate_events(std::vector<Event>& events) {
    std::vector<Event> unique_events;
    
    for (const auto& event : events) {
        bool is_duplicate = false;
        
        for (const auto& unique_event : unique_events) {
            if (are_events_duplicate(event, unique_event)) {
                is_duplicate = true;
                break;
            }
        }
        
        if (!is_duplicate) {
            unique_events.push_back(event);
        }
    }
    
    events = std::move(unique_events);
}

} // namespace zerocost



#ifndef SCORING_H
#define SCORING_H

#include "event.h"
#include <vector>
#include <string>

namespace zerocost {

/**
 * Calculate urgency score based on time until event starts
 * Events starting soon score higher
 * 
 * @param start_time Event start time
 * @param current_time Current time
 * @return Score between 0.0 and 1.0
 */
double calculate_urgency_score(std::time_t start_time, std::time_t current_time);

/**
 * Calculate popularity score based on views and saves
 * 
 * @param view_count Number of views
 * @param save_count Number of saves
 * @return Score between 0.0 and 1.0
 */
double calculate_popularity_score(int view_count, int save_count);

/**
 * Calculate freshness score based on when event was created
 * Newer events score higher
 * 
 * @param created_at Event creation time
 * @param current_time Current time
 * @return Score between 0.0 and 1.0
 */
double calculate_freshness_score(std::time_t created_at, std::time_t current_time);

/**
 * Calculate text similarity score between query and event
 * Using simple word overlap and fuzzy matching
 * 
 * @param query Search query
 * @param text Event text (title + description)
 * @return Score between 0.0 and 1.0
 */
double calculate_text_similarity(const std::string& query, const std::string& text);

/**
 * Calculate category preference score
 * 
 * @param event_category Event's category
 * @param preferred_categories User's preferred categories
 * @return Score between 0.0 and 1.0
 */
double calculate_category_score(const std::string& event_category, 
                                const std::vector<std::string>& preferred_categories);

/**
 * Calculate final composite score for an event
 * 
 * @param event Event to score
 * @param user_location User's location and preferences
 * @param query Optional search query
 * @return Final score (higher is better)
 */
double calculate_final_score(const Event& event, 
                             const UserLocation& user_location,
                             const std::string& query = "");

/**
 * Check if two events are duplicates based on title, location, and time similarity
 * 
 * @param event1 First event
 * @param event2 Second event
 * @return true if events are likely duplicates
 */
bool are_events_duplicate(const Event& event1, const Event& event2);

/**
 * Remove duplicate events from a list, keeping the one with higher score
 * 
 * @param events List of events (will be modified in place)
 */
void deduplicate_events(std::vector<Event>& events);

} // namespace zerocost

#endif // SCORING_H



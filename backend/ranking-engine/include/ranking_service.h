#ifndef RANKING_SERVICE_H
#define RANKING_SERVICE_H

#include "event.h"
#include <vector>
#include <string>

namespace zerocost {

class RankingService {
public:
    /**
     * Rank events based on multiple factors:
     * - Distance from user
     * - Time urgency
     * - Popularity (views, saves)
     * - Freshness
     * - User preferences
     * 
     * @param request Ranking request with events and user context
     * @return Ranked and filtered events
     */
    RankingResponse rank_events(const RankingRequest& request);
    
    /**
     * Search and rank events based on query
     * 
     * @param request Ranking request
     * @param query Search query string
     * @return Ranked events matching query
     */
    RankingResponse search_and_rank(const RankingRequest& request, 
                                    const std::string& query);
private:
    void calculate_distances(std::vector<Event>& events, 
                            const UserLocation& user_location,
                            double max_distance_km);
    
    void calculate_scores(std::vector<Event>& events, 
                         const UserLocation& user_location,
                         const std::string& query = "");
    
    void sort_by_score(std::vector<Event>& events);
};

} // namespace zerocost

#endif // RANKING_SERVICE_H



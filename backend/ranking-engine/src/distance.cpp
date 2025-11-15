#include "distance.h"
#include <cmath>

namespace zerocost {

constexpr double EARTH_RADIUS_KM = 6371.0;
constexpr double PI = 3.14159265358979323846;

double to_radians(double degrees) {
    return degrees * PI / 180.0;
}

double haversine_distance(double lat1, double lon1, double lat2, double lon2) {
    // Convert to radians
    lat1 = to_radians(lat1);
    lon1 = to_radians(lon1);
    lat2 = to_radians(lat2);
    lon2 = to_radians(lon2);
    
    // Haversine formula
    double dlat = lat2 - lat1;
    double dlon = lon2 - lon1;
    
    double a = std::sin(dlat / 2) * std::sin(dlat / 2) +
               std::cos(lat1) * std::cos(lat2) *
               std::sin(dlon / 2) * std::sin(dlon / 2);
    
    double c = 2 * std::atan2(std::sqrt(a), std::sqrt(1 - a));
    
    return EARTH_RADIUS_KM * c;
}

double calculate_distance_score(double distance_km, double max_distance_km) {
    if (distance_km >= max_distance_km) {
        return 0.0;
    }
    
    // Exponential decay: closer events get much higher scores
    // At 0 km: score = 1.0
    // At max_distance/2: score ≈ 0.37
    // At max_distance: score = 0.0
    double normalized_distance = distance_km / max_distance_km;
    return std::exp(-3.0 * normalized_distance);
}

} // namespace zerocost



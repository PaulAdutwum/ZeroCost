#ifndef DISTANCE_H
#define DISTANCE_H

namespace zerocost {

/**
 * Calculate the great-circle distance between two points on Earth
 * using the Haversine formula.
 * 
 * @param lat1 Latitude of point 1 (degrees)
 * @param lon1 Longitude of point 1 (degrees)
 * @param lat2 Latitude of point 2 (degrees)
 * @param lon2 Longitude of point 2 (degrees)
 * @return Distance in kilometers
 */
double haversine_distance(double lat1, double lon1, double lat2, double lon2);

/**
 * Calculate distance score (higher is better, closer locations score higher)
 * 
 * @param distance_km Distance in kilometers
 * @param max_distance_km Maximum acceptable distance
 * @return Score between 0.0 and 1.0
 */
double calculate_distance_score(double distance_km, double max_distance_km);

} // namespace zerocost

#endif // DISTANCE_H



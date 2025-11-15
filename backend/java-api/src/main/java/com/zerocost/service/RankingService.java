package com.zerocost.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.zerocost.dto.EventDTO;
import com.zerocost.dto.NearbyEventsRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RankingService {

    private final ObjectMapper objectMapper;

    @Value("${app.ranking-engine.url}")
    private String rankingEngineUrl;

    public List<EventDTO> rankEvents(List<EventDTO> events, NearbyEventsRequest request) {
        if (events.isEmpty()) {
            return events;
        }

        try {
            // Build request for ranking engine
            ObjectNode requestBody = objectMapper.createObjectNode();
            
            ObjectNode userLocation = objectMapper.createObjectNode();
            userLocation.put("latitude", request.getLatitude());
            userLocation.put("longitude", request.getLongitude());
            requestBody.set("user_location", userLocation);
            
            requestBody.put("max_distance_km", request.getMaxDistanceKm());
            requestBody.put("limit", request.getLimit());
            
            // Add events
            ArrayNode eventsArray = objectMapper.createArrayNode();
            for (EventDTO event : events) {
                ObjectNode eventNode = objectMapper.createObjectNode();
                eventNode.put("id", event.getId().toString());
                eventNode.put("title", event.getTitle());
                eventNode.put("description", event.getDescription() != null ? event.getDescription() : "");
                eventNode.put("latitude", event.getLatitude());
                eventNode.put("longitude", event.getLongitude());
                eventNode.put("start_time", event.getStartTime().toString());
                if (event.getEndTime() != null) {
                    eventNode.put("end_time", event.getEndTime().toString());
                }
                eventNode.put("category", event.getCategory() != null ? event.getCategory() : "");
                eventNode.put("view_count", 0); // TODO: Get from interactions table
                eventNode.put("save_count", 0);
                eventNode.put("created_at", event.getCreatedAt().toString());
                eventsArray.add(eventNode);
            }
            requestBody.set("events", eventsArray);

            // Call ranking engine
            RestClient restClient = RestClient.create();
            String response = restClient.post()
                .uri(rankingEngineUrl + "/rank")
                .header("Content-Type", "application/json")
                .body(requestBody.toString())
                .retrieve()
                .body(String.class);

            // Parse response
            JsonNode responseJson = objectMapper.readTree(response);
            ArrayNode rankedEvents = (ArrayNode) responseJson.get("ranked_events");
            
            List<EventDTO> result = new ArrayList<>();
            for (JsonNode rankedEvent : rankedEvents) {
                String eventId = rankedEvent.get("id").asText();
                double score = rankedEvent.get("score").asDouble();
                double distanceKm = rankedEvent.get("distance_km").asDouble();
                
                // Find original event and add score/distance
                events.stream()
                    .filter(e -> e.getId().toString().equals(eventId))
                    .findFirst()
                    .ifPresent(e -> {
                        e.setScore(score);
                        e.setDistanceKm(distanceKm);
                        result.add(e);
                    });
            }
            
            log.info("Ranked {} events in {}ms", 
                result.size(), 
                responseJson.get("processing_time_ms").asDouble());
            
            return result;
            
        } catch (Exception e) {
            log.error("Failed to rank events using ranking engine, returning unranked", e);
            return events.subList(0, Math.min(request.getLimit(), events.size()));
        }
    }
}



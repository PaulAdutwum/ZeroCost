package com.zerocost.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EventDTO {
    
    private UUID id;
    private String title;
    private String description;
    private Double latitude;
    private Double longitude;
    private String address;
    private Instant startTime;
    private Instant endTime;
    private String category;
    private UUID categoryId;
    private String source;
    private UUID sourceId;
    private String sourceUrl;
    private String imageUrl;
    private String organizerName;
    private String organizerContact;
    private Integer capacity;
    private Boolean isVerified;
    private Instant createdAt;
    private Instant updatedAt;
    
    // Additional fields for ranking
    private Double distanceKm;
    private Double score;
}



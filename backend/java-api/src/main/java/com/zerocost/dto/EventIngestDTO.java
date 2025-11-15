package com.zerocost.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventIngestDTO {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    @NotNull(message = "Latitude is required")
    private Double latitude;
    
    @NotNull(message = "Longitude is required")
    private Double longitude;
    
    private String address;
    
    @NotNull(message = "Start time is required")
    private Instant startTime;
    
    private Instant endTime;
    
    @NotBlank(message = "Category is required")
    private String category;
    
    @NotBlank(message = "Source is required")
    private String source;
    
    private String sourceUrl;
    private String imageUrl;
    private String organizer;
    private Integer capacity;
    private Map<String, Object> rawData;
}



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
public class UserDTO {
    
    private UUID id;
    private String email;
    private String fullName;
    private String profileImageUrl;
    private Double homeLatitude;
    private Double homeLongitude;
    private Double notificationRadiusKm;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
}



package com.zerocost.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zerocost.dto.EventDTO;
import com.zerocost.dto.EventIngestDTO;
import com.zerocost.dto.NearbyEventsRequest;
import com.zerocost.entity.Category;
import com.zerocost.entity.Event;
import com.zerocost.entity.Source;
import com.zerocost.repository.CategoryRepository;
import com.zerocost.repository.EventRepository;
import com.zerocost.repository.SourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final CategoryRepository categoryRepository;
    private final SourceRepository sourceRepository;
    private final RankingService rankingService;
    private final ObjectMapper objectMapper;

    @Transactional
    public EventDTO createEvent(EventIngestDTO dto) {
        // Get or create category
        Category category = categoryRepository.findByName(dto.getCategory())
            .orElseGet(() -> {
                Category newCategory = Category.builder()
                    .name(dto.getCategory())
                    .build();
                return categoryRepository.save(newCategory);
            });

        // Get or create source
        Source source = sourceRepository.findByName(dto.getSource())
            .orElseGet(() -> {
                Source newSource = Source.builder()
                    .name(dto.getSource())
                    .build();
                return sourceRepository.save(newSource);
            });

        // Build event
        Event event = Event.builder()
            .title(dto.getTitle())
            .description(dto.getDescription())
            .latitude(dto.getLatitude())
            .longitude(dto.getLongitude())
            .address(dto.getAddress())
            .startTime(dto.getStartTime())
            .endTime(dto.getEndTime())
            .category(category)
            .source(source)
            .sourceUrl(dto.getSourceUrl())
            .imageUrl(dto.getImageUrl())
            .organizerName(dto.getOrganizer())
            .capacity(dto.getCapacity())
            .isVerified(false)
            .build();

        // Serialize raw data
        if (dto.getRawData() != null) {
            try {
                event.setRawData(objectMapper.writeValueAsString(dto.getRawData()));
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize raw data", e);
            }
        }

        event = eventRepository.save(event);
        return toDTO(event);
    }

    @Transactional
    public List<EventDTO> ingestEvents(List<EventIngestDTO> events) {
        log.info("Ingesting {} events", events.size());
        return events.stream()
            .map(this::createEvent)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<EventDTO> getEventById(UUID id) {
        return eventRepository.findById(id).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "upcomingEvents", key = "#pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<EventDTO> getUpcomingEvents(Pageable pageable) {
        return eventRepository.findUpcomingEvents(Instant.now(), pageable)
            .map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public List<EventDTO> getNearbyEvents(NearbyEventsRequest request) {
        double radiusMeters = request.getMaxDistanceKm() * 1000;
        
        List<Event> events = eventRepository.findNearbyEvents(
            request.getLatitude(),
            request.getLongitude(),
            radiusMeters,
            Instant.now()
        );

        List<EventDTO> eventDTOs = events.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());

        // Use ranking service to rank and filter events
        return rankingService.rankEvents(eventDTOs, request);
    }

    @Transactional(readOnly = true)
    public List<EventDTO> searchEvents(String query) {
        return eventRepository.searchEvents(query).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EventDTO> getEventsByCategory(UUID categoryId) {
        return eventRepository.findByCategoryAndUpcoming(categoryId, Instant.now()).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    private EventDTO toDTO(Event event) {
        return EventDTO.builder()
            .id(event.getId())
            .title(event.getTitle())
            .description(event.getDescription())
            .latitude(event.getLatitude())
            .longitude(event.getLongitude())
            .address(event.getAddress())
            .startTime(event.getStartTime())
            .endTime(event.getEndTime())
            .category(event.getCategory() != null ? event.getCategory().getName() : null)
            .categoryId(event.getCategory() != null ? event.getCategory().getId() : null)
            .source(event.getSource() != null ? event.getSource().getName() : null)
            .sourceId(event.getSource() != null ? event.getSource().getId() : null)
            .sourceUrl(event.getSourceUrl())
            .imageUrl(event.getImageUrl())
            .organizerName(event.getOrganizerName())
            .organizerContact(event.getOrganizerContact())
            .capacity(event.getCapacity())
            .isVerified(event.getIsVerified())
            .createdAt(event.getCreatedAt())
            .updatedAt(event.getUpdatedAt())
            .build();
    }
}



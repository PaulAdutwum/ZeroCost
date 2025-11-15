package com.zerocost.controller;

import com.zerocost.dto.EventDTO;
import com.zerocost.dto.EventIngestDTO;
import com.zerocost.dto.NearbyEventsRequest;
import com.zerocost.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EventController {

    private final EventService eventService;

    @PostMapping("/ingest")
    public ResponseEntity<Map<String, Object>> ingestEvents(@Valid @RequestBody Map<String, List<EventIngestDTO>> request) {
        List<EventIngestDTO> events = request.get("events");
        List<EventDTO> createdEvents = eventService.ingestEvents(events);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "success", true,
            "count", createdEvents.size(),
            "events", createdEvents
        ));
    }

    @GetMapping
    public ResponseEntity<Page<EventDTO>> getAllEvents(@PageableDefault(size = 20) Pageable pageable) {
        Page<EventDTO> events = eventService.getUpcomingEvents(pageable);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventDTO> getEventById(@PathVariable UUID id) {
        return eventService.getEventById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/nearby")
    public ResponseEntity<List<EventDTO>> getNearbyEvents(@Valid @RequestBody NearbyEventsRequest request) {
        List<EventDTO> events = eventService.getNearbyEvents(request);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/search")
    public ResponseEntity<List<EventDTO>> searchEvents(@RequestParam String query) {
        List<EventDTO> events = eventService.searchEvents(query);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<List<EventDTO>> getEventsByCategory(@PathVariable UUID categoryId) {
        List<EventDTO> events = eventService.getEventsByCategory(categoryId);
        return ResponseEntity.ok(events);
    }
}



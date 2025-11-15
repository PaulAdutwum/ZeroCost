package com.zerocost.repository;

import com.zerocost.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {

    @Query(value = "SELECT e.* FROM events e " +
           "WHERE ST_DWithin(e.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, :radiusMeters) " +
           "AND e.start_time >= :startTime " +
           "ORDER BY e.start_time ASC",
           nativeQuery = true)
    List<Event> findNearbyEvents(
        @Param("latitude") double latitude,
        @Param("longitude") double longitude,
        @Param("radiusMeters") double radiusMeters,
        @Param("startTime") Instant startTime
    );

    @Query("SELECT e FROM Event e WHERE e.startTime >= :startTime ORDER BY e.createdAt DESC")
    Page<Event> findUpcomingEvents(@Param("startTime") Instant startTime, Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.category.id = :categoryId AND e.startTime >= :startTime ORDER BY e.startTime ASC")
    List<Event> findByCategoryAndUpcoming(@Param("categoryId") UUID categoryId, @Param("startTime") Instant startTime);

    @Query("SELECT e FROM Event e WHERE LOWER(e.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(e.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Event> searchEvents(@Param("query") String query);

    List<Event> findBySourceIdAndStartTimeAfter(UUID sourceId, Instant startTime);
}



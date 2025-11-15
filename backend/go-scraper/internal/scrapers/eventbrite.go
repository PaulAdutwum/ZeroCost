package scrapers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/zerocost/scraper/internal/config"
	"github.com/zerocost/scraper/internal/models"
	"golang.org/x/time/rate"
)

type EventbriteScraper struct {
	config      *config.Config
	rateLimiter *rate.Limiter
	httpClient  *http.Client
}

func NewEventbriteScraper(cfg *config.Config, limiter *rate.Limiter) *EventbriteScraper {
	return &EventbriteScraper{
		config:      cfg,
		rateLimiter: limiter,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (s *EventbriteScraper) Name() string {
	return "Eventbrite"
}

func (s *EventbriteScraper) Scrape(ctx context.Context) ([]models.Event, error) {
	// Skip if no API key configured
	if s.config.EventbriteAPIKey == "" {
		log.Println("Eventbrite API key not configured, skipping")
		return nil, nil
	}

	// Wait for rate limiter
	if err := s.rateLimiter.Wait(ctx); err != nil {
		return nil, err
	}

	// Search for free events in major cities
	events := make([]models.Event, 0)
	locations := []struct {
		lat, lng float64
		name     string
	}{
		{37.7749, -122.4194, "San Francisco"},
		{40.7128, -74.0060, "New York"},
		{34.0522, -118.2437, "Los Angeles"},
	}

	for _, loc := range locations {
		select {
		case <-ctx.Done():
			return events, ctx.Err()
		default:
			locationEvents, err := s.scrapeLocation(ctx, loc.lat, loc.lng, loc.name)
			if err != nil {
				log.Printf("Error scraping Eventbrite for %s: %v", loc.name, err)
				continue
			}
			events = append(events, locationEvents...)
		}
	}

	return events, nil
}

func (s *EventbriteScraper) scrapeLocation(ctx context.Context, lat, lng float64, locationName string) ([]models.Event, error) {
	if err := s.rateLimiter.Wait(ctx); err != nil {
		return nil, err
	}

	// Eventbrite API v3
	url := fmt.Sprintf("https://www.eventbriteapi.com/v3/events/search/?location.latitude=%f&location.longitude=%f&location.within=25km&price=free&sort_by=date", lat, lng)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+s.config.EventbriteAPIKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("eventbrite API returned status %d: %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var eventbriteResp struct {
		Events []struct {
			ID   string `json:"id"`
			Name struct {
				Text string `json:"text"`
			} `json:"name"`
			Description struct {
				Text string `json:"text"`
			} `json:"description"`
			URL   string `json:"url"`
			Start struct {
				Local    string `json:"local"`
				Timezone string `json:"timezone"`
			} `json:"start"`
			End struct {
				Local    string `json:"local"`
				Timezone string `json:"timezone"`
			} `json:"end"`
			Venue struct {
				Address struct {
					City      string `json:"city"`
					Address1  string `json:"address_1"`
					Latitude  string `json:"latitude"`
					Longitude string `json:"longitude"`
				} `json:"address"`
				Name string `json:"name"`
			} `json:"venue"`
			Category struct {
				Name string `json:"name"`
			} `json:"category"`
			Organizer struct {
				Name string `json:"name"`
			} `json:"organizer"`
			Logo struct {
				URL string `json:"url"`
			} `json:"logo"`
			Capacity int `json:"capacity"`
		} `json:"events"`
	}

	if err := json.Unmarshal(body, &eventbriteResp); err != nil {
		return nil, err
	}

	events := make([]models.Event, 0)

	for _, eb := range eventbriteResp.Events {
		// Parse start time
		startTime, err := time.Parse("2006-01-02T15:04:05", eb.Start.Local)
		if err != nil {
			log.Printf("Failed to parse start time: %v", err)
			continue
		}

		// Parse end time
		var endTime *time.Time
		if eb.End.Local != "" {
			t, err := time.Parse("2006-01-02T15:04:05", eb.End.Local)
			if err == nil {
				endTime = &t
			}
		}

		// Parse coordinates
		var eventLat, eventLng float64
		fmt.Sscanf(eb.Venue.Address.Latitude, "%f", &eventLat)
		fmt.Sscanf(eb.Venue.Address.Longitude, "%f", &eventLng)

		// Use location defaults if venue coordinates missing
		if eventLat == 0 && eventLng == 0 {
			eventLat = lat
			eventLng = lng
		}

		address := eb.Venue.Address.Address1
		if eb.Venue.Address.City != "" {
			address += ", " + eb.Venue.Address.City
		}

		event := models.Event{
			Title:       eb.Name.Text,
			Description: eb.Description.Text,
			Latitude:    eventLat,
			Longitude:   eventLng,
			Address:     address,
			StartTime:   startTime,
			EndTime:     endTime,
			Category:    s.mapCategory(eb.Category.Name),
			Source:      "Eventbrite",
			SourceURL:   eb.URL,
			ImageURL:    eb.Logo.URL,
			Organizer:   eb.Organizer.Name,
			Capacity:    eb.Capacity,
			RawData: map[string]interface{}{
				"event_id": eb.ID,
				"venue":    eb.Venue.Name,
			},
		}

		events = append(events, event)
	}

	return events, nil
}

func (s *EventbriteScraper) mapCategory(ebCategory string) string {
	categoryLower := strings.ToLower(ebCategory)

	categoryMap := map[string]string{
		"food":      "Free Food",
		"music":     "Entertainment",
		"arts":      "Entertainment",
		"film":      "Entertainment",
		"workshop":  "Workshops",
		"education": "Workshops",
		"community": "Community Events",
		"sports":    "Sports",
		"health":    "Health & Wellness",
		"business":  "Workshops",
		"charity":   "Community Events",
	}

	for keyword, category := range categoryMap {
		if strings.Contains(categoryLower, keyword) {
			return category
		}
	}

	return "Community Events"
}

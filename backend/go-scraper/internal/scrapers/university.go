package scrapers

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/gocolly/colly/v2"
	"github.com/zerocost/scraper/internal/config"
	"github.com/zerocost/scraper/internal/models"
	"golang.org/x/time/rate"
)

type UniversityScraper struct {
	config      *config.Config
	rateLimiter *rate.Limiter
}

func NewUniversityScraper(cfg *config.Config, limiter *rate.Limiter) *UniversityScraper {
	return &UniversityScraper{
		config:      cfg,
		rateLimiter: limiter,
	}
}

func (s *UniversityScraper) Name() string {
	return "University Pages"
}

func (s *UniversityScraper) Scrape(ctx context.Context) ([]models.Event, error) {
	events := make([]models.Event, 0)

	// List of university event pages to scrape
	universities := []struct {
		name string
		url  string
		lat  float64
		lng  float64
	}{
		{
			name: "UC Berkeley",
			url:  "https://events.berkeley.edu/",
			lat:  37.8715,
			lng:  -122.2730,
		},
		{
			name: "Stanford",
			url:  "https://events.stanford.edu/",
			lat:  37.4275,
			lng:  -122.1697,
		},
	}

	for _, uni := range universities {
		select {
		case <-ctx.Done():
			return events, ctx.Err()
		default:
			uniEvents, err := s.scrapeUniversity(ctx, uni.name, uni.url, uni.lat, uni.lng)
			if err != nil {
				log.Printf("Error scraping %s: %v", uni.name, err)
				continue
			}
			events = append(events, uniEvents...)
		}
	}

	return events, nil
}

func (s *UniversityScraper) scrapeUniversity(ctx context.Context, name, url string, lat, lng float64) ([]models.Event, error) {
	if err := s.rateLimiter.Wait(ctx); err != nil {
		return nil, err
	}

	events := make([]models.Event, 0)

	c := colly.NewCollector(
		colly.UserAgent(s.config.UserAgent),
		colly.AllowedDomains(extractDomain(url)...),
	)

	c.SetRequestTimeout(30 * time.Second)

	// Parse event listings
	c.OnHTML(".event-item, .event, article", func(e *colly.HTMLElement) {
		title := strings.TrimSpace(e.ChildText(".event-title, .title, h2, h3"))
		if title == "" {
			return
		}

		description := strings.TrimSpace(e.ChildText(".event-description, .description, p"))
		eventURL := e.Request.AbsoluteURL(e.ChildAttr("a", "href"))

		// Try to parse time
		timeStr := strings.TrimSpace(e.ChildText(".event-time, .time, time"))
		startTime := parseUniversityTime(timeStr)

		// Check if event is free
		priceText := strings.ToLower(e.Text)
		if !strings.Contains(priceText, "free") && !strings.Contains(priceText, "no cost") &&
			!strings.Contains(priceText, "$0") {
			return // Skip non-free events
		}

		event := models.Event{
			Title:       title,
			Description: description,
			Latitude:    lat,
			Longitude:   lng,
			Address:     name + " Campus",
			StartTime:   startTime,
			Category:    "Campus Events",
			Source:      name,
			SourceURL:   eventURL,
		}

		events = append(events, event)
	})

	c.OnError(func(r *colly.Response, err error) {
		log.Printf("Error scraping %s: %v", url, err)
	})

	if err := c.Visit(url); err != nil {
		return nil, err
	}

	return events, nil
}

func extractDomain(url string) []string {
	// Simple domain extraction
	parts := strings.Split(url, "//")
	if len(parts) < 2 {
		return []string{}
	}
	domain := strings.Split(parts[1], "/")[0]
	return []string{domain}
}

func parseUniversityTime(timeStr string) time.Time {
	// Try common time formats
	formats := []string{
		"January 2, 2006 3:04 PM",
		"Jan 2, 2006 3:04 PM",
		"2006-01-02 15:04",
		"01/02/2006 3:04 PM",
		"Monday, January 2, 2006 at 3:04 PM",
	}

	for _, format := range formats {
		if t, err := time.Parse(format, timeStr); err == nil {
			return t
		}
	}

	// Default to next week if parsing fails
	return time.Now().Add(7 * 24 * time.Hour)
}

// Helper to extract text from HTML selection
func extractText(s *goquery.Selection) string {
	return strings.TrimSpace(s.Text())
}
